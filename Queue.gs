module.exports = Queue;

class Queue {
  constructor() {
    this.head_array = [];
    this.tail_array = [];
    this.length = 0;
  }
}

Queue.prototype.push = function(element) {
  this.head_array.push(element);
  this.length += 1;
}

Queue.prototype.pop = function() {
  if (this.tail_array.length === 0) {
    if (this.head_array.length === 0) {
      return NaN;
    }
    while (this.head_array.length !== 0) {
      this.tail_array.push(this.head_array.pop());
    }
  }
  this.length -= 1;
  return this.tail_array.pop();
}

Queue.prototype.front = function() {
  if (this.tail_array.length !== 0) {
    return this.tail_array[this.tail_array.length - 1];
  }
  if (this.head_array.length !== 0) {
    return this.head_array[0];
  }
  return NaN;
}

Queue.prototype.back = function() {
  if (this.head_array.length !== 0) {
    return this.head_array[this.head_array.length - 1];
  }
  if (this.tail_array.length !== 0) {
    return this.tail_array[0];
  }
  return NaN;
}