const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');
const { parseExcel } = require('../utils/excelParser');

const router = express.Router();

// Multer config — store in memory for direct buffer access
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.xlsx?$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xls, .xlsx) are allowed'), false);
    }
  },
});

// Supabase client (lazy init to allow env to load first)
let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

/**
 * POST /login
 * Simple password-based admin login.
 */
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  return res.json({ token: process.env.ADMIN_SECRET });
});

/**
 * POST /upload
 * Upload an Excel timetable file, parse it, and store in Supabase.
 * Protected by auth middleware.
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    }

    // Parse the Excel file
    const rows = parseExcel(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No valid rows found in the uploaded file.' });
    }

    const db = getSupabase();

    // Clear existing timetable_slots
    const { error: deleteError } = await db
      .from('timetable_slots')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

    if (deleteError) {
      console.error('Error clearing timetable_slots:', deleteError);
      return res.status(500).json({ error: 'Failed to clear existing data', details: deleteError.message });
    }

    // Bulk insert in chunks of 1000
    const chunkSize = 1000;
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { data, error: insertError } = await db
        .from('timetable_slots')
        .insert(chunk)
        .select();

      if (insertError) {
        console.error(`Error inserting chunk ${i / chunkSize + 1}:`, insertError);
        return res.status(500).json({
          error: 'Failed to insert data',
          details: insertError.message,
          insertedSoFar: insertedCount,
        });
      }

      insertedCount += (data ? data.length : chunk.length);
    }

    // Deactivate previous meta records
    await db
      .from('timetable_meta')
      .update({ is_active: false })
      .eq('is_active', true);

    // Create new timetable_meta record
    const metaRecord = {
      semester_label: req.body.semester_label || 'Current Semester',
      uploaded_at: new Date().toISOString(),
      row_count: insertedCount,
      is_active: true,
    };

    const { error: metaError } = await db
      .from('timetable_meta')
      .insert(metaRecord);

    if (metaError) {
      console.warn('Warning: Failed to update timetable_meta:', metaError.message);
      // Non-fatal — data is already inserted
    }

    return res.json({
      success: true,
      rowCount: insertedCount,
      filename: req.file.originalname,
      uploadedAt: metaRecord.uploaded_at,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Helper to get GoogleGenAI client (lazy init to avoid crashing if not used)
let ai;
function getAI() {
  const { GoogleGenAI } = require('@google/genai');
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

/**
 * GET /api/admin/issues
 * Fetch all pending issues from timetable_issues
 */
router.get('/issues', async (req, res) => {
  try {
    const db = getSupabase();
    // Assuming table 'timetable_issues' exists.
    const { data, error } = await db
      .from('timetable_issues')
      .select('*')
      .order('reported_at', { ascending: false });

    if (error) {
      // If table doesn't exist, we return empty array for now gracefully
      if (error.code === '42P01') {
         return res.json({ issues: [] });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ issues: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

/**
 * POST /api/admin/analyze-issues
 * Analyzes pending issues and provides a suggestion
 */
router.post('/analyze-issues', async (req, res) => {
  try {
    const db = getSupabase();
    
    // Fetch pending issues
    const { data: issuesData, error: issuesError } = await db
      .from('timetable_issues')
      .select('*')
      .eq('status', 'pending');

    if (issuesError) {
      if (issuesError.code === '42P01') {
         return res.json({ analysis: "No pending issues found (table not created)." });
      }
      return res.status(500).json({ error: issuesError.message });
    }

    if (!issuesData || issuesData.length === 0) {
      return res.json({ analysis: "No pending issues to analyze." });
    }

    // Format issues with their new building and slot contexts
    const issueTexts = issuesData.map(i => {
      return `[Building: ${i.building || 'Unknown'}] [Room: ${i.room || 'Unknown'}] [Time: ${i.slot_time || 'Unknown'}] [Type: ${i.issue_type || 'General'}] "${i.query_text}"`;
    }).join('\n');

    const prompt = `
You are the Admin AI for Timbel. Students have reported the following issues regarding the timetable:

${issueTexts}

Analyze these reported timetable issues. You MUST format your response as follows:
1. Group the issues by Building (e.g., C-Block, D-Block).
2. For each building, identify if multiple students are complaining about the EXACT SAME room and time slot.
3. Provide a clear, collective summary of the issues.
4. Suggest a "Final Decision" on what data needs to be altered in the database/Excel for each building.

Write your analysis clearly so the human admin can read it and quickly apply the fixes.
`;

    const aiClient = getAI();
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze issues' });
  }
});

/**
 * POST /api/admin/issues/resolve
 * Marks a specific issue as resolved
 */
router.post('/issues/resolve', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Issue ID required' });

    const db = getSupabase();
    const { error } = await db
      .from('timetable_issues')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resolve issue' });
  }
});

/**
 * POST /api/admin/apply-ai-changes
 * Applies simple heuristic changes to timetable_slots based on pending issues,
 * and marks them all as resolved.
 */
router.post('/apply-ai-changes', authMiddleware, async (req, res) => {
  try {
    const db = getSupabase();
    
    // Fetch all pending issues
    const { data: issuesData, error: issuesError } = await db
      .from('timetable_issues')
      .select('*')
      .eq('status', 'pending');

    if (issuesError) return res.status(500).json({ error: issuesError.message });
    if (!issuesData || issuesData.length === 0) return res.json({ success: true, changesApplied: 0 });

    let changesApplied = 0;

    for (const issue of issuesData) {
      if (issue.issue_type === 'Class Canceled' || issue.issue_type === 'Slot Empty') {
        const slot = typeof issue.slot_data === 'string' ? JSON.parse(issue.slot_data) : issue.slot_data;
        if (slot && (slot.room || slot.room_name) && slot.day && slot.start_time) {
          const roomToMatch = slot.room || slot.room_name;
          // Delete the slot
          const { error: delError } = await db
            .from('timetable_slots')
            .delete()
            .eq('room', roomToMatch)
            .eq('day', slot.day)
            .eq('start_time', slot.start_time)
            .eq('end_time', slot.end_time);
            
          if (!delError) changesApplied++;
        }
      }
      
      // Update the issue to resolved
      await db
        .from('timetable_issues')
        .update({ status: 'resolved' })
        .eq('id', issue.id);
    }

    res.json({ success: true, changesApplied });
  } catch (err) {
    console.error('Error applying AI changes:', err);
    res.status(500).json({ error: 'Failed to apply changes' });
  }
});

/**
 * DELETE /api/admin/issues/clear-resolved
 * Deletes all issues that have been marked as resolved
 */
router.delete('/issues/clear-resolved', async (req, res) => {
  try {
    const db = getSupabase();
    const { error } = await db
      .from('timetable_issues')
      .delete()
      .eq('status', 'resolved');

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear resolved issues' });
  }
});

/**
 * GET /api/admin/slot-metadata
 * Returns distinct subjects, teachers, buildings, and session types from timetable_slots.
 * Used to populate searchable dropdowns in the Add Slot form.
 */
router.get('/slot-metadata', authMiddleware, async (req, res) => {
  try {
    const db = getSupabase();
    const pageSize = 1000;

    const subjects = new Set();
    const teachers = new Set();
    const buildings = new Set();
    const sessionTypes = new Set();
    const classCodes = new Set();

    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await db
        .from('timetable_slots')
        .select('subject, teacher, building, session_type, class_code')
        .range(from, from + pageSize - 1);

      if (error) return res.status(500).json({ error: error.message });
      if (!data || data.length === 0) { hasMore = false; break; }

      for (const row of data) {
        if (row.subject) subjects.add(row.subject.trim());
        if (row.teacher) teachers.add(row.teacher.trim());
        if (row.building) buildings.add(row.building.trim());
        if (row.session_type) sessionTypes.add(row.session_type.trim());
        if (row.class_code) classCodes.add(row.class_code.trim());
      }

      from += pageSize;
      if (data.length < pageSize) hasMore = false;
    }

    res.json({
      subjects: [...subjects].sort(),
      teachers: [...teachers].sort(),
      buildings: [...buildings].sort(),
      sessionTypes: [...sessionTypes].sort(),
      classCodes: [...classCodes].sort(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch slot metadata' });
  }
});

/**
 * POST /api/admin/add-slot
 * Manually inserts a single slot into timetable_slots.
 * Checks for duplicates (same room + day + overlapping time).
 */
router.post('/add-slot', authMiddleware, async (req, res) => {
  try {
    const {
      building, room, subject, teacher, day,
      start_time, end_time, session_type,
      class_code, section, program, year
    } = req.body;

    // Validate required fields
    const required = { building, room, subject, teacher, day, start_time, end_time };
    for (const [key, val] of Object.entries(required)) {
      if (!val || !String(val).trim()) {
        return res.status(400).json({ error: `Field "${key}" is required.` });
      }
    }

    const db = getSupabase();

    // Duplicate check: same room + day + start_time + section
    // This allows different sections to share the same room/time (e.g. Lab A and Lab B in C210)
    const { data: existing, error: checkError } = await db
      .from('timetable_slots')
      .select('id')
      .eq('room', room.trim().toUpperCase())
      .eq('day', day.trim().toUpperCase())
      .eq('start_time', start_time.trim())
      .eq('section', (section || '').trim().toUpperCase());

    if (checkError) return res.status(500).json({ error: checkError.message });

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: `Slot already exists for Room ${room} on ${day} at ${start_time} for Section ${section || 'All'}. Duplicate not allowed.`
      });
    }

    const newSlot = {
      building: building.trim().toUpperCase(),
      room: room.trim().toUpperCase(),
      subject: subject.trim(),
      teacher: teacher.trim(),
      day: day.trim().toUpperCase(),
      start_time: start_time.trim(),
      end_time: end_time.trim(),
      session_type: (session_type || 'LEC').trim().toUpperCase(),
      class_code: (class_code || '').trim().toUpperCase(),
      section: (section || '').trim().toUpperCase(),
      program: (program || '').trim().toUpperCase(),
      year: year ? String(year).trim() : '',
    };

    const { data, error: insertError } = await db
      .from('timetable_slots')
      .insert(newSlot)
      .select();

    if (insertError) return res.status(500).json({ error: insertError.message });

    res.status(201).json({ success: true, slot: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add slot' });
  }
});

/**
 * GET /api/admin/search-slots
 * Searches slots based on optional filters: building, room, day.
 */
router.get('/search-slots', authMiddleware, async (req, res) => {
  try {
    const { building, room, day } = req.query;
    const db = getSupabase();

    let query = db.from('timetable_slots').select('*');

    if (building) query = query.eq('building', building.trim().toUpperCase());
    if (room) query = query.eq('room', room.trim().toUpperCase());
    if (day) query = query.eq('day', day.trim().toUpperCase());

    const { data, error } = await query.order('day').order('start_time').limit(200);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ slots: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search slots' });
  }
});

/**
 * DELETE /api/admin/slots/:id
 * Deletes a specific timetable slot by its ID.
 */
router.delete('/slots/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Slot ID is required' });

    const db = getSupabase();
    const { error } = await db
      .from('timetable_slots')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

/**
 * PUT /api/admin/slots/:id
 * Updates an existing timetable slot by its ID.
 */
router.put('/slots/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Slot ID is required' });

    const updateData = req.body;
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Update data is required' });
    }

    const db = getSupabase();
    const { data, error } = await db
      .from('timetable_slots')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, slot: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update slot' });
  }
});

module.exports = router;

