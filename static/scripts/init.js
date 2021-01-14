function insert(name, value) {
  console.log("inserting " + name + " <- " + value);
  document.getElementById(name).innerHTML = value
}

function append(name, node) {
  console.log("[appending] " + name);
  document.getElementById(name).appendChild(node);
}

function insertItem(item) {
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

function createItemListNode(item) {
  let li = document.createElement("li");
  let a = document.createElement("a");
  a.innerText = item.name;
  a.setAttribute("href", `/item/${item.id}`);
  let span = document.createElement("span");
  span.innerText = ` [price: ${item.price}$] [amount: ${item.amount}]`
  li.appendChild(a);
  li.appendChild(span);
  return li;
}

function insertItemList(items) {
  for (item of items) {
    append("itemList", createItemListNode(item));
  }
}
