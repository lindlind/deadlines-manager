const EMPTY_VALUE = "";
const EMPTY_CELL_VALUE = undefined;

function cellIsEmpty(cell) {
  return cell.value === EMPTY_CELL_VALUE;
}

function cellWasEmpty(cell) {
  return cell.oldValue === EMPTY_CELL_VALUE;
}

function cellRangeIsEmpty(range) {
  return range.getValue() === EMPTY_VALUE;
}

function onEdit(cell) {
  let deadlines_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Дедлайны");
  let timeline_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Расписание");
  let weekhours_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Занятость на неделе");
  
  
  Logger.log("cell: (row = " + cell.range.getRow() + ", col = " + cell.range.getColumn() + ")");
  Logger.log("old value: " + cell.oldValue);
  Logger.log("new value: " + cell.value);
  Logger.log("");
  
  
  if (cell.range.getRow() === 1 && cell.range.getColumn() === 3 && !cellIsEmpty(cell)) {
    Logger.log("CreateTimeline button was pushed.");
    cell.range.clearContent();
    
    let weekhours = weekhours_sheet.getRange(1,2,8).getValues();
    weekhours = weekhours.map(function(arr) {return arr[0]; });
    weekhours[0] = weekhours[7];
    weekhours.pop();
    
    let deadlines_headers = deadlines_sheet.getRange(1,1,1,6).getValues()[0];
    let deadlines = deadlines_sheet.getRange(2,1,100,6).getValues();
    while (deadlines[deadlines.length - 1][0] === "") {
      deadlines.pop();
    }
    
    let todayDate = new Date();
    todayDate = new Date(todayDate.setHours(0,0,0,0));
    let timeline = new Timeline(todayDate, weekhours);
    
    let tasks = [];
    deadlines.forEach(row => tasks.push(new Task(row[0],row[1],new Date(row[2]),row[3]+row[4]-row[5])));
    timeline.constructTimeline(tasks);
    
    let timelineAsTable = timeline.toTable();
    timeline_sheet.getRange(5, 1, timelineAsTable.length, 3).setValues(timelineAsTable);
  }
}
