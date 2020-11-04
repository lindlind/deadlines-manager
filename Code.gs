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
    
    let deadlines_headers = deadlines_sheet.getRange(1,1,1,5).getValues()[0];
    let deadlines = deadlines_sheet.getRange(2,1,100,5).getValues();
    while (deadlines[deadlines.length - 1][0] === "") {
      deadlines.pop();
    }
    
    let timeline = calculateTimeline(deadlines_headers, deadlines, weekhours);
    timeline_sheet.getRange(5, 1, timeline.length, 3).setValues(timeline);
  }
}

function calculateTimeline(deadlines_headers, deadlines, weekhours) {
  let today_date = new Date();
  
  let cmp = function(a, b) {
    if (a[1] !== b[1]) {
      return b[1] - a[1];
    }
    return a[2] - b[2];
  };
  deadlines.sort(cmp);
  
  let timetable = new Array();
  for (let i = 0; i < deadlines.length; i++) {
    let tmp_timetable = timetable.map(function(arr) {return arr.slice();})
    let left_hours_per_task = deadlines[i][3];
    let deadline_date = new Date(deadlines[i][2]);
    let cur_day = dateToNumber(deadline_date) - dateToNumber(today_date) - 1;
    let cur_weekday = (deadline_date.getDay() + 6) % 7;
    let shifted_tasks = new Queue();
    
    while (left_hours_per_task > 0) {
      if (timetable[cur_day] === undefined) {
        timetable[cur_day] = [];
      } else {
        while (timetable[cur_day].length !== 0) {
          shifted_tasks.push(timetable[cur_day].pop());
        }
      }
      
      let cur_day_date_in_table = Utilities.formatDate(dayNumberToDate(today_date,cur_day), "GMT+3", "dd.MM");
      let hours_per_cur_day = Math.min(left_hours_per_task, weekhours[cur_weekday]);
      timetable[cur_day].push([cur_day_date_in_table, deadlines[i][0], hours_per_cur_day]);
      left_hours_per_task -= hours_per_cur_day;
      
      hours_per_cur_day = weekhours[cur_weekday] - hours_per_cur_day;
      while (shifted_tasks.length > 0 && hours_per_cur_day > 0) {
        let task = shifted_tasks.front();
        let hours_per_cur_task = Math.min(hours_per_cur_day, task[2]);
        timetable[cur_day].push([cur_day_date_in_table, task[1], hours_per_cur_task]);
        hours_per_cur_day -= hours_per_cur_task;
        task[2] -= hours_per_cur_task;
        if (task[2] === 0) {
          shifted_tasks.pop();
        }
      }
      
      cur_day--;
      cur_weekday = (cur_weekday + 6) % 7;
    }
    
    while (shifted_tasks.length > 0 && cur_day >= 0) {
      if (timetable[cur_day] === undefined) {
        timetable[cur_day] = [];
      } else {
        while (timetable[cur_day].length !== 0) {
          shifted_tasks.push(timetable[cur_day].pop());
        }
      }
      
      let cur_day_date_in_table = Utilities.formatDate(dayNumberToDate(today_date,cur_day), "GMT+3", "dd.MM");
      let hours_per_cur_day = weekhours[cur_weekday];
      while (shifted_tasks.length > 0 && hours_per_cur_day > 0) {
        let task = shifted_tasks.front();
        let hours_per_cur_task = Math.min(hours_per_cur_day, task[2]);
        timetable[cur_day].push([cur_day_date_in_table, task[1], hours_per_cur_task]);
        hours_per_cur_day -= hours_per_cur_task;
        task[2] -= hours_per_cur_task;
        if (task[2] === 0) {
          shifted_tasks.pop();
        }
      }
      
      cur_day--;
      cur_weekday = (cur_weekday + 6) % 7;
    }
    
    Logger.log("Timetable, added deadline " + deadlines[i][0] + ":");
    for (let i in timetable) {
      for (let j in timetable[i]) {
        Logger.log(timetable[i][j]);
      }
    }
    
    if (cur_day < 0) {
      timetable = tmp_timetable.map(function(arr) {return arr.slice();})
    }
  }
  
  
  
  let compact_to_left_timetable = new Array();
  let cur_compact_day = 0;
  compact_to_left_timetable[cur_compact_day] = [];
  let cur_compact_weekday = today_date.getDay();
  let left_hours_per_day = weekhours[cur_compact_weekday];
  
  for (let j in timetable[cur_compact_day]) {
    if (timetable[cur_compact_day][j] === undefined) {
      continue;
    }
    compact_to_left_timetable[cur_compact_day].push(timetable[cur_compact_day][j].slice());
    left_hours_per_day -= timetable[cur_compact_day][j][2];
    timetable[cur_compact_day][j] = undefined;
  }
  
  while (left_hours_per_day === 0) {
    cur_compact_day++;
    compact_to_left_timetable[cur_compact_day] = [];
    cur_compact_weekday = (cur_compact_weekday + 1) % 7;
    left_hours_per_day = weekhours[cur_compact_weekday];
    
    for (let j in timetable[cur_compact_day]) {
      if (timetable[cur_compact_day][j] === undefined) {
        continue;
      }
      compact_to_left_timetable[cur_compact_day].push(timetable[cur_compact_day][j].slice());
      left_hours_per_day -= timetable[cur_compact_day][j][2];
      timetable[cur_compact_day][j] = undefined;
    }
  }
  
  for (let i = 0; i < deadlines.length; i++) {
    for (let cur_day in timetable) {
      if (cur_day <= cur_compact_day) {
        continue;
      }
      let ind = -1;
      for (let j in timetable[cur_day]) {
        if (timetable[cur_day][j] === undefined) {
          continue;
        }
        if (timetable[cur_day][j][1] === deadlines[i][0]) {
          ind = j;
        }
      }
      if (ind == -1) {
        continue;
      }
      
      while (timetable[cur_day][ind][2] > 0) {
        let hours_per_task = Math.min(timetable[cur_day][ind][2], left_hours_per_day);
        let cur_day_date_in_table = Utilities.formatDate(dayNumberToDate(today_date,cur_compact_day), "GMT+3", "dd.MM");
        compact_to_left_timetable[cur_compact_day].push([cur_day_date_in_table, deadlines[i][0], hours_per_task]);
        left_hours_per_day -= hours_per_task;
        timetable[cur_day][ind][2] -= hours_per_task;
        
        while (left_hours_per_day === 0) {
          cur_compact_day++;
          compact_to_left_timetable[cur_compact_day] = [];
          cur_compact_weekday = (cur_compact_weekday + 1) % 7;
          left_hours_per_day = weekhours[cur_compact_weekday];
          
          for (let j in timetable[cur_compact_day]) {
            if (timetable[cur_compact_day][j] === undefined) {
              continue;
            }
            compact_to_left_timetable[cur_compact_day].push(timetable[cur_compact_day][j].slice());
            left_hours_per_day -= timetable[cur_compact_day][j][2];
            timetable[cur_compact_day][j] = undefined;
          }
        }
      }
      
      timetable[cur_day][ind] = undefined;
    }
  }
  
  Logger.log("Compact to left:");
  for (let i in compact_to_left_timetable) {
    for (let j in compact_to_left_timetable[i]) {
      Logger.log(compact_to_left_timetable[i][j]);
    }
  }
  
  let timeline = [];
  for (let i = 0; i < compact_to_left_timetable.length; i++) {
    let cur_day_tasks = [];
    for (let j in compact_to_left_timetable[i]) {
      cur_day_tasks.push(compact_to_left_timetable[i][j].slice());
    }
    cur_day_tasks.sort(function(a,b) {
      if (a[1] < b[1]) {
        return -1;
      }
      if (a[1] > b[1]) {
        return 1;
      }
      return 0;
    });
    for (let j = 0; j < cur_day_tasks.length; j++) {
      if (j === 0 || cur_day_tasks[j-1][1] !== cur_day_tasks[j][1]) {
        timeline.push(cur_day_tasks[j]);
      } else {
        timeline[timeline.length - 1][2] += cur_day_tasks[j][2];
      }
    }
  }
  
  return timeline;
}

function dateToNumber(date) {
  return Math.floor(((date-0) + 1000 * 60 * 60 * 3) / (1000 * 60 * 60 * 24));
}

function dayNumberToDate(today_date, number) {
  return new Date((dateToNumber(today_date) + number) * (1000 * 60 * 60 * 24) - 1000 * 60 * 60 * 3);
}
