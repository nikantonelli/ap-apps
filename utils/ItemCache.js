
class ItemCache {
	constructor(size) {
		this.size = size;
		this.map = new Map();
		this.head = {};
		this.tail = {};
		this.head.next = this.tail
		this.tail.prev = this.head;
	}

	get(id) {
		console.log("getting: ",id);
		if (this.map.has(id)) {
			// remove elem from current position
			let c = this.map.get(id);
			c.prev.next = c.next;
			c.next.prev = c.prev;
		
			this.tail.prev.next = c; // insert it after last element. Element before tail
			c.prev = this.tail.prev; // update c.prev and next pointer
			c.next = this.tail;
			this.tail.prev = c; // update last element as tail
		
			return c.value;
		  } else {
			return null; // element does not exist
		  }
	}

	put(id, item) {
		console.log("adding: ",id);
		if (this.get(id) !== -1) {
			// if key does not exist, update last element value
			this.tail.prev.value = item;
		  } else {
			// check if map size is at capacity
			if (this.map.size === this.capacity) {
			  //delete item both from map and DLL
			  this.map.delete(this.head.next.key); // delete first element of list
			  this.head.next = this.head.next.next; // update first element as next element
			  this.head.next.prev = this.head;
			}
		
			let newNode = {
			  value: item,
			  key: id,
			}; // each node is a hashtable that stores key and value
		
			// when adding a new node, we need to update both map and DLL
			this.map.set(id, newNode); // add current node to map
			this.tail.prev.next = newNode; // add node to end of the list
			newNode.prev = this.tail.prev; // update prev and next pointers of newNode
			newNode.next = this.tail;
			this.tail.prev = newNode; // update last element
		  }
	}
}
export default ItemCache;