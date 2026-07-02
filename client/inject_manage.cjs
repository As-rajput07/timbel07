const fs = require('fs');

const currentCodePath = 'src/pages/AdminPage.jsx';
const oldCodePath = 'old_AdminPage.jsx';

let currentCode = fs.readFileSync(currentCodePath, 'utf8');
const oldCode = fs.readFileSync(oldCodePath, 'utf8');

// 1. Extract state
const stateMatch = oldCode.match(/\/\/ Manage Slots State\n([\s\S]*?)\/\/ Delete Class Timetable State/);
if (stateMatch) {
  currentCode = currentCode.replace(
    '  // Unified Class Timetable State',
    stateMatch[0] + '\n  // Unified Class Timetable State'
  );
}

// 2. Update fetchMetadata hook (if activeTab === manage-slots)
currentCode = currentCode.replace(
  /if \(token && activeTab === 'class-timetables' && metadata\.subjects\.length === 0\) fetchMetadata\(\)/,
  `if (token && (activeTab === 'class-timetables' || activeTab === 'manage-slots') && metadata.subjects.length === 0) fetchMetadata()`
);

// 3. Extract handleManageSearch and handleEditSlot
const searchMatch = oldCode.match(/const handleManageSearch = async [\s\S]*?const handleDeleteSlot = async/);
const editMatch = oldCode.match(/const handleEditSlot = async [\s\S]*?const handleSlotFormChange =/);

if (searchMatch && editMatch) {
  const methods = searchMatch[0].replace('const handleDeleteSlot = async', '') + '\n' + editMatch[0].replace('const handleSlotFormChange =', '');
  
  currentCode = currentCode.replace(
    '  const fetchClassSchedule = async',
    methods + '\n  const fetchClassSchedule = async'
  );
}

// 4. Update handleDeleteSlot to update manageResults
currentCode = currentCode.replace(
  'if (selectedClass) fetchClassSchedule(selectedClass)',
  'if (selectedClass) fetchClassSchedule(selectedClass)\n        if (typeof setManageResults === "function") setManageResults(prev => prev.filter(s => s.id !== id))'
);

// 5. Extract Tab Button
const tabButtonMatch = oldCode.match(/<button[\s\S]*?activeTab === 'manage-slots'[\s\S]*?<\/button>/);
if (tabButtonMatch) {
  currentCode = currentCode.replace(
    /onClick=\{\(\) => setActiveTab\('class-timetables'\)\}\n          >\n            <Edit3 size=\{15\} \/> Class Timetables\n          <\/button>/,
    `onClick={() => setActiveTab('class-timetables')}\n          >\n            <Edit3 size={15} /> Class Timetables\n          </button>\n          ` + tabButtonMatch[0]
  );
}

// 6. Extract Tab Body
const tabBodyMatch = oldCode.match(/{\/\* ══════════ MANAGE SLOTS TAB ══════════ \*\/}[\s\S]*?(?={\/\* ══════════ DELETE CLASS TAB ══════════ \*\/)/);
if (tabBodyMatch) {
  currentCode = currentCode.replace(
    /        {\/\* ══════════ SLOT MODAL \(Add \/ Edit\) ══════════ \*\//,
    tabBodyMatch[0] + '\n        {/* ══════════ SLOT MODAL (Add / Edit) ══════════ */'
  );
}

fs.writeFileSync(currentCodePath, currentCode);
console.log('Successfully injected Manage Slots back into AdminPage.jsx');
