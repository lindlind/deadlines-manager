class Task {
  constructor(name, priority, deadline, hours) {
    this.name = name;
    this.priority = priority;
    this.deadline = deadline;
    this.hours = hours;
  }

  truncate(hours) {
    let extra = new Task(this.name,
                         this.priority,
                         this.deadline, 
                         Math.max(0, this.hours - hours)
                        );
    this.hours -= extra.hours;
    return extra;
  }

  static cmp(task1, task2) {
    let priorDiff    = task1.priority - task2.priority;
    let deadlineDiff = task1.deadline - task2.deadline;
    let hoursDiff    = task1.hours    - task2.hours;

    if (priorDiff    !== 0) return -priorDiff;
    if (deadlineDiff !== 0) return  deadlineDiff;
    if (hoursDiff    !== 0) return  hoursDiff;
    return 0;
  }

  static mergeEqualInList(tasks) {
    let merged = []
    tasks.forEach(task => {
      if (merged.length === 0 || merged[merged.length - 1].name !== task.name) {
        merged.push(task);
      } else {
        merged[merged.length - 1].hours += task.hours;
      }
    });
    return merged;
  }

  static splitListByHours(tasks, leftHoursTarget) {
    let leftTasksHours = 0;
    let rightTasksStartInd = 0;
    while (leftTasksHours < leftHoursTarget) {
      leftTasksHours += tasks[rightTasksStartInd].hours;
      rightTasksStartInd++;
      if (rightTasksStartInd === tasks.length) {
        break;
      }
    }

    if (leftTasksHours <= leftHoursTarget) {
      return [tasks.slice(0, rightTasksStartInd), 
              tasks.slice(rightTasksStartInd, tasks.length)];
    }

    let leftLastTaskHours = leftHoursTarget - (leftTasksHours - tasks[rightTasksStartInd - 1].hours);
    let rightFirstTask = tasks[rightTasksStartInd - 1].truncate(leftLastTaskHours);
    return [tasks.slice(0, rightTasksStartInd), 
            [rightFirstTask].concat(tasks.slice(rightTasksStartInd, tasks.length))];
  }
}

class DayPlans {
  constructor(hours) {
    this.hours = hours
    this.plans = []
  }

  addTasksSaveOld(tasks) {
    this.plans = [].concat(this.plans, tasks)
    let leftRightPlans = Task.splitListByHours(this.plans, this.hours);
    this.plans = leftRightPlans[0].sort(Task.cmp);
    return leftRightPlans[1];
  }

  addTasksSaveLowPrior(tasks) {
    let allPlans = [].concat(this.plans, tasks).sort(Task.cmp);
    this.plans = Task.mergeEqualInList(allPlans);
    let leftRightPlans = Task.splitListByHours(this.plans, Math.max(0, this.getBusyHours() - this.hours));
    this.plans = leftRightPlans[1];
    return leftRightPlans[0];
  }

  getBusyHours() {
    return this.plans.reduce((h, task) => h + task.hours, 0);
  }

  removeTask(taskToRemove) {
    this.plans.forEach(task => {
                       if (task.name === taskToRemove.name) {
                         taskToRemove.hours += task.hours;
                       }
    });
    this.plans = this.plans.filter(task => task.name !== taskToRemove.name);
    return taskToRemove;
  }
}

let prevDate = function(date) {
  return new Date(date.setDate(date.getDate() - 1));
}

let nextDate = function(date) {
  return new Date(date.setDate(date.getDate() + 1));
}

class Timeline {
  constructor(date, weekHours) {
    this.startWorkingDate = date;
    this.weekHours = weekHours;
    this.siftedTimeline = []
  }

  isEnoughTimeForTask(task) {
    let busyHours = 0;
    for (let date in this.siftedTimeline) {
      if (date - task.deadline < 0) {
        busyHours += this.siftedTimeline[date].getBusyHours();
      } else {
        break;
      }
    }

    let allHours = 0;
    let date = new Date(this.startWorkingDate);
    while (date - task.deadline < 0) {
      allHours += this.weekHours[date.getDay()];
      date = nextDate(date);
    }

    return allHours >= busyHours + task.hours;
  }

  addTask(task) {
    let date = prevDate(new Date(task.deadline));
    let tasksToAdd = [task];
    while (tasksToAdd.length > 0) {
      if (this.siftedTimeline[date] === undefined) {
        this.siftedTimeline[date] = new DayPlans(this.weekHours[date.getDay()]);
      }
      tasksToAdd = this.siftedTimeline[date].addTasksSaveLowPrior(tasksToAdd);
      date = prevDate(date);
    }
  }

  liftUpTask(_task) {
    let task = new Task(_task.name, _task.priority, _task.deadline, 0);
    for (let date in this.siftedTimeline) {
      task = this.siftedTimeline[date].removeTask(task);
    }
    let date = new Date(this.startWorkingDate);
    let tasksToAdd = [task];
    while (tasksToAdd.length > 0) {
      if (this.siftedTimeline[date] === undefined) {
        this.siftedTimeline[date] = new DayPlans(this.weekHours[date.getDay()]);
      }
      tasksToAdd = this.siftedTimeline[date].addTasksSaveOld(tasksToAdd);
      date = nextDate(date);
    }
    
  }

  toTable() {
    let table = []
    for (let date in this.siftedTimeline) {
      this.siftedTimeline[date].plans.forEach(task => table.push([date, task.name, task.hours]));
    }
    table = table.sort((a,b) => new Date(a[0]) - new Date(b[0]));
    table = table.map(row => [Utilities.formatDate(new Date(row[0]), "GMT+3", "dd.MM"),row[1],row[2]]);
    return table;
  }
  
  constructTimeline(tasks) {
    tasks.sort(Task.cmp);
    console.log("sorted");
    tasks.forEach(task => {
                  if (this.isEnoughTimeForTask(task)) {
                    this.addTask(task);
                  }
    });
    console.log("calculated");
    //this.liftUpTask(tasks[0]);
    //this.liftUpTask(tasks[1]);
    tasks.forEach(task => this.liftUpTask(task));
    console.log("compacted");
  }

}
