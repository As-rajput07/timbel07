const fs = require('fs');
const oldCode = fs.readFileSync('old_AdminPage.jsx', 'utf8');
let newCode = fs.readFileSync('src/pages/AdminPage.jsx', 'utf8');

// 1. Manage Slots State (old lines 57-74)
const stateStart = oldCode.indexOf('// Manage Slots State');
const stateEnd = oldCode.indexOf('// Delete Class Timetable State');
const stateBlock = oldCode.substring(stateStart, stateEnd);

newCode = newCode.replace('useEffect(() => {', stateBlock + 'useEffect(() => {');

// 2. Fetch metadata if manage-slots
newCode = newCode.replace(
  "if (token && activeTab === 'class-timetables' && metadata.subjects.length === 0) fetchMetadata()",
  "if (token && (activeTab === 'class-timetables' || activeTab === 'manage-slots') && metadata.subjects.length === 0) fetchMetadata()"
);

// 3. Handlers
const searchStart = oldCode.indexOf('const handleManageSearch = async (e) => {');
const searchEnd = oldCode.indexOf('const handleDeleteSlot = async (id) => {');
const searchBlock = oldCode.substring(searchStart, searchEnd);

const editStart = oldCode.indexOf('const handleEditSlot = async (id) => {');
const editEnd = oldCode.indexOf('const handleSlotFormChange = (field, value) => {');
const editBlock = oldCode.substring(editStart, editEnd);

newCode = newCode.replace('const handleSlotFormChange = (field, value) =>', searchBlock + editBlock + 'const handleSlotFormChange = (field, value) =>');

// 4. Update handleDeleteSlot to update manageResults
newCode = newCode.replace('if (selectedClass) fetchClassSchedule(selectedClass)', 'if (selectedClass) fetchClassSchedule(selectedClass);\n        if (typeof setManageResults === "function") setManageResults(prev => prev.filter(s => s.id !== id));');

// 5. Button
const buttonStart = oldCode.indexOf("<button\n            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'manage-slots'");
const buttonEnd = oldCode.indexOf("<button\n            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'delete-class'");
const buttonBlock = oldCode.substring(buttonStart, buttonEnd);

newCode = newCode.replace("<button\n            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'queries'", buttonBlock + "<button\n            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'queries'");

// 6. Tab Content
const tabStart = oldCode.indexOf('{/* ══════════ MANAGE SLOTS TAB ══════════ */}');
const tabEnd = oldCode.indexOf('{/* ══════════ DELETE CLASS TAB ══════════ */}');
const tabBlock = oldCode.substring(tabStart, tabEnd);

newCode = newCode.replace('{/* ══════════ SLOT MODAL (Add / Edit) ══════════ */}', tabBlock + '{/* ══════════ SLOT MODAL (Add / Edit) ══════════ */}');

fs.writeFileSync('src/pages/AdminPage.jsx', newCode);
console.log('Restored manage-slots UI!');
