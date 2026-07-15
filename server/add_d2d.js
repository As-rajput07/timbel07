require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const d2dSlots = [
  // C006 THU
  { room: 'C006', building: 'C', day: 'THU', start_time: '09:50', end_time: '10:45', subject: 'Discrete Structures & Graph Theory (Tut)', teacher: 'Ms. PRAKRUTI DAVE', class_code: 'D2D3A-A', session_type: 'TUT', program: 'B.Tech', year: '2' },
  { room: 'C006', building: 'C', day: 'THU', start_time: '09:50', end_time: '10:45', subject: 'Discrete Structures & Graph Theory (Tut)', teacher: 'Ms. GEETANJALI RATHOD', class_code: 'D2D3A-B', session_type: 'TUT', program: 'B.Tech', year: '2' },
  { room: 'C006', building: 'C', day: 'THU', start_time: '10:45', end_time: '11:40', subject: 'Discrete Structures & Graph Theory (Tut)', teacher: 'Ms. PRAKRUTI DAVE', class_code: 'D2D3A-A', session_type: 'TUT', program: 'B.Tech', year: '2' },
  { room: 'C006', building: 'C', day: 'THU', start_time: '10:45', end_time: '11:40', subject: 'Discrete Structures & Graph Theory (Tut)', teacher: 'Ms. GEETANJALI RATHOD', class_code: 'D2D3A-B', session_type: 'TUT', program: 'B.Tech', year: '2' },
  { room: 'C006', building: 'C', day: 'THU', start_time: '12:35', end_time: '13:30', subject: 'IPDC-I', teacher: 'Ms. MEETA GOHIL', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  
  // C006 FRI
  { room: 'C006', building: 'C', day: 'FRI', start_time: '08:00', end_time: '08:55', subject: 'Upper Intermediate Communicative English', teacher: 'Mr. Arnab Das', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C006', building: 'C', day: 'FRI', start_time: '08:55', end_time: '09:50', subject: 'IPDC-I', teacher: 'Ms. MEETA GOHIL', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C006', building: 'C', day: 'FRI', start_time: '12:35', end_time: '13:30', subject: 'Discrete Structures & Graph Theory', teacher: 'Ms. PRAKRUTI DAVE', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C006', building: 'C', day: 'FRI', start_time: '14:25', end_time: '15:20', subject: 'Database Management System', teacher: 'TBD', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  
  // C007 THU
  { room: 'C007', building: 'C', day: 'THU', start_time: '14:25', end_time: '15:20', subject: 'Database Management System', teacher: 'Ms. MAULIKA PATEL', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  
  // C007 FRI
  { room: 'C007', building: 'C', day: 'FRI', start_time: '09:50', end_time: '10:45', subject: 'Discrete Structures & Graph Theory', teacher: 'Ms. REEMA SORATHIYA', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C007', building: 'C', day: 'FRI', start_time: '10:45', end_time: '11:40', subject: 'Object Oriented Programming with Java', teacher: 'Mr. ANURAG ANAND', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C007', building: 'C', day: 'FRI', start_time: '12:35', end_time: '13:30', subject: 'Discrete Structures & Graph Theory', teacher: 'Ms. PRAKRUTI DAVE', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C007', building: 'C', day: 'FRI', start_time: '13:30', end_time: '14:25', subject: 'Upper Intermediate Communicative English', teacher: 'Mr. Arnab Das', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C007', building: 'C', day: 'FRI', start_time: '14:25', end_time: '15:20', subject: 'Database Management Systems', teacher: 'Ms. MAULIKA PATEL', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  
  // C007 SAT
  { room: 'C007', building: 'C', day: 'SAT', start_time: '08:55', end_time: '09:50', subject: 'Computer Organization & Architecture', teacher: 'Mr. RAHUL KUMAR YADAV', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C007', building: 'C', day: 'SAT', start_time: '09:50', end_time: '10:45', subject: 'Data Structures', teacher: 'Ms. SUBHASHINI K.', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C007', building: 'C', day: 'SAT', start_time: '10:45', end_time: '11:40', subject: 'Data Structures', teacher: 'TBD', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C007', building: 'C', day: 'SAT', start_time: '12:35', end_time: '13:30', subject: 'Object Oriented Programming with Java', teacher: 'Mr. ANURAG ANAND', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C007', building: 'C', day: 'SAT', start_time: '13:30', end_time: '14:25', subject: 'Object Oriented Programming with Java', teacher: 'Mr. ANISH KUMAR', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  
  // C012 THU
  { room: 'C012', building: 'C', day: 'THU', start_time: '09:50', end_time: '10:45', subject: 'Discrete Structures & Graph Theory (Tut)', teacher: 'Ms. REEMA SORATHIYA', class_code: 'D2D3B-A', session_type: 'TUT', program: 'B.Tech', year: '2' },
  { room: 'C012', building: 'C', day: 'THU', start_time: '09:50', end_time: '10:45', subject: 'Discrete Structures & Graph Theory (Tut)', teacher: 'Dr. SUNIL KUNDU', class_code: 'D2D3B-B', session_type: 'TUT', program: 'B.Tech', year: '2' },
  { room: 'C012', building: 'C', day: 'THU', start_time: '10:45', end_time: '11:40', subject: 'Discrete Structures & Graph Theory (Tut)', teacher: 'Ms. REEMA SORATHIYA', class_code: 'D2D3B-A', session_type: 'TUT', program: 'B.Tech', year: '2' },
  { room: 'C012', building: 'C', day: 'THU', start_time: '10:45', end_time: '11:40', subject: 'Discrete Structures & Graph Theory (Tut)', teacher: 'Dr. SUNIL KUNDU', class_code: 'D2D3B-B', session_type: 'TUT', program: 'B.Tech', year: '2' },
  
  // C012 FRI
  { room: 'C012', building: 'C', day: 'FRI', start_time: '13:30', end_time: '14:25', subject: 'Data Structures', teacher: 'Ms. SUBHASHINI K.', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
  
  // C013 THU
  { room: 'C013', building: 'C', day: 'THU', start_time: '09:50', end_time: '10:45', subject: 'IPDC-I', teacher: 'Ms. MEETA GOHIL', class_code: 'D2D3A', session_type: 'LEC', program: 'B.Tech', year: '2' },
  { room: 'C013', building: 'C', day: 'THU', start_time: '14:25', end_time: '15:20', subject: 'Upper Intermediate Communicative English', teacher: 'Mr. Arnab Das', class_code: 'D2D3B', session_type: 'LEC', program: 'B.Tech', year: '2' },
];

async function insertD2DSlots() {
  console.log('Inserting ' + d2dSlots.length + ' D2D slots into Supabase...');
  
  // First, optionally delete them if they somehow exist to avoid duplicates
  for (const slot of d2dSlots) {
    await db.from('timetable_slots')
      .delete()
      .match({ 
        room: slot.room, 
        day: slot.day, 
        start_time: slot.start_time, 
        class_code: slot.class_code 
      });
  }

  const { data, error } = await db.from('timetable_slots').insert(d2dSlots);
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted D2D slots.');
  }
}

insertD2DSlots();
