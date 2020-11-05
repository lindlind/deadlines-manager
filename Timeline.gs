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
                         Math.min(0, this.hours - hours)
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
    while (leftTasksHours < hours) {
      leftTasksHours += tasks[rightTasksStartInd].hours;
      rightTasksStartInd++;
      if (rightTasksStartInd === tasks.length) {
        break;
      }
    }

    if (leftTasksHours === leftHoursTarget) {
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
    [].concat(this.plans, tasks)
    leftRightPlans = Task.splitListByHours(this.plans, this.hours);
    this.plans = leftRightPlans[0].sort(Task.cmp);
    return leftRightPlans[1];
  }

  addTasksSaveLowPrior(tasks) {
    let allPlans = [].concat(this.plans, tasks).sort(Task.cmp);
    this.plans = Task.mergeEqualInList(allPlans);
    leftRightPlans = Task.splitListByHours(this.plans, Math.max(0, getBusyHours() - this.hours));
    this.plans = leftRightPlans[1];
    return leftRightPlans[0];
  }

  getBusyHours() {
    return this.plans.reduce((task1, task2) => task1.hours + task2.hours, 0);
  }

  removeTask(taskToRemove) {
    this.plans.forEach(task => if (task.name === taskToRemove.name) 
                                taskToRemove.hours += task.hours);
    this.plans.filter(task => task.name !== taskToRemove.name);
    return remTask;
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
    let date = this.startWorkingDate;
    while (date - task.deadline < 0) {
      allHours += this.weekHours[date.getDay()];
      date = nextDate(date);
    }

    return allHours >= busyHours + task.hours;
  }

  addTask(task) {
    let date = prevDate(task.deadline);
    let tasksToAdd = [task];
    while (tasksToAdd.length > 0) {
      if (this.siftedTimeline[date] === undefined) {
        this.siftedTimeline[date] = new DayPlans(this.weekHours[date.getDay()]);
      }
      tasksToAdd = this.siftedTimeline[date].addTasksSaveLowPrior(tasksToAdd);
      date = prevDate(date);
    }
  }

  liftUpTask(task) {
    task.hours = 0;
    for (let date in this.siftedTimeline) {
      task = this.siftedTimeline[date].removeTask(task);
    }
    let date = this.startWorkingDate;
    let tasksToAdd = [task];
    while (tasksToAdd.length > 0) {
      if (this.siftedTimeline[date] === undefined) {
        this.siftedTimeline[date] = new DayPlans(this.weekHours[date.getDay()]);
      }
      tasksToAdd = this.siftedTimeline[date].addTasksSaveOld(tasksToAdd);
      date = nextDate(date);
    }
    
  }

  constructTimeline(tasks) {
    tasks.sort(Task.cmp);
    tasks.forEach(task => if (isEnoughTimeForTask(task)) 
                            addTask(task));
    tasks.forEach(task => liftUpTask(task));
  }

}
