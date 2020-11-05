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

  static mergeEqual(tasks) {
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
}

class DayPlans {
  constructor(hours) {
    this.hours = hours
    this.plans = []
  }

  addTasksIgnoreOverflow(tasks) {
    let allPlans = [].concat(this.plans, tasks).sort(Task.cmp);
    this.plans = mergedEqual(allPlans);
  }

  addTasksSaveHighPrior(tasks) {
    addTasksIgnoreOverflow(tasks);
    //TODO
  }

  addTasksSaveLowPrior(tasks) {
    addTasksIgnoreOverflow(tasks);
    //TODO
  }
}

class Timeline {
  //TODO
}

