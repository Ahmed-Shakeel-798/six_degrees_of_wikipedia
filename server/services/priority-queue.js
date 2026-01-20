class PriorityQueue {

  constructor(ignoreDepth = false) {
    this.items = [];
    this.ignoreDepth = ignoreDepth
  }

  push(node) {
    /**
     * If no priority value, just push into the array
     */
    if(node.priority === 0) {
        this.items.push(node);
        return;     
    }

    /**
     * Using binary-insert for efficiency
     */
    let low = 0;
    let high = this.items.length;

    while (low < high) {
      const mid = (low + high) >> 1;
      const cmp = this.compare(node, this.items[mid]);
      if (cmp < 0) high = mid;
      else low = mid + 1;
    }

    this.items.splice(low, 0, node);
  }

  shift() {
    return this.items.shift();
  }

  get length() {
    return this.items.length;
  }

  compare(a, b) {
    if(!this.ignoreDepth) {
      if (a.depth !== b.depth) return a.depth - b.depth; // BFS preserved
      return b.priority - a.priority; // within depth, higher heuristic first
    }

    return b.priority - a.priority;
  }
}

export default PriorityQueue;
