function insert(name, value) {
  document.getElementById(name).innerHTML = value
}

function append(name, node) {
  document.getElementById(name).appendChild(node);
}

function checkbox(name, checked) {
 document.getElementById(name).checked = checked;
}

function insertItem(id) {
  function success(item) {
    if (item) {
      insert("title", "weppo - " + item.name);
      insert("itemName", item.name);
      insert("itemPrice", item.price);
      insert("itemAmount", item.amount);
      if (item.available)
        insert("itemAvailable", "available");
      else
        insert("itemAvailable", "not available");
    } else {
      insert("title", "weppo - Not found.");
      insert("item", "Item not found.");
    }
  }
  getItemById(id, success, console.log);
}

function insertItemUpdate(id) {
  function success(item) {
    if (item) {
      insert("title", "weppo - " + item.name);
      insert("itemName", item.name);
      insert("itemPrice", item.price);
      insert("itemAmount", item.amount);
      checkbox("available", item.available);
      checkbox("visible", !item.hidden);
    } else {
      insert("title", "weppo - Not found.");
      insert("item", "Item not found.");
    }
  }
  getItemById(id, success, console.log);
}

function createItemListNode(item) {
  let li = document.createElement("li");
  let a1 = document.createElement("a");
  a1.innerText = item.name;
  a1.setAttribute("href", `/item/${item.id}`);
  let a2 = document.createElement("a");
  a2.innerText = "Modify"
  a2.setAttribute("href", `/update/item/${item.id}`);
  let span = document.createElement("span");
  span.innerText = ` [price: ${item.price}$] [amount: ${item.amount}] `
  li.appendChild(a1);
  li.appendChild(span);
  li.appendChild(a2);
  return li;
}

function insertItemList() {
  function success(items) {
    items.sort((a, b) => {return a.id - b.id});
    for (item of items) {
      append("itemList", createItemListNode(item));
    }
  }
  getItemList(success, console.log);
}
