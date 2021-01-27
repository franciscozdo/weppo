/* INITIALIZATION */

function notFound(msg) {
  insert("title", "weppo - Not found.");
  insert("item", "Item not found.");
}

function insertItem(id) {
  function success(item) {
    if (item) {
      insert("title", "weppo - " + item.name);
      insert("itemName", item.name);
      insert("itemPrice", item.price);
      insert("itemAmount", item.amount);
      if (item.available && item.amount > 0) {
        insert("itemAvailable", "available");
      } else {
        insert("itemAvailable", "not available");
        document.getElementById("addToCart").remove();
      }
    }
  }
  getItemById(id, success, notFound);
}

function insertItemUpdate(id) {
  function success(item) {
    console.log("Insert itme update" + item);
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
  getItemById(id, success, notFound);
}

function createItemListNode(item) {
  let li = document.createElement("li");
  let a1 = document.createElement("a");
  a1.innerText = item.name;
  a1.setAttribute("href", `/item/${item.id}`);
  let span = document.createElement("span");
  span.innerText = ` [price: ${item.price}$] [amount: ${item.amount}] `
  li.appendChild(a1);
  li.appendChild(span);
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

/* ACTIONS */

function addItem() {
  let form = document.getElementById("itemAdd");
  let item = {};
  for (e of form.elements) {
    switch(e.name) {
      case "name":
        if (e.value != "")
          item.name = e.value;
        break;
      case "price":
        if (e.value != "")
          item.price = e.value;
        break;
      case "amount":
        if (e.value != "")
          item.amount = e.value;
        break;
      case "available":
        item.available = e.checked;
    }
  }
  item.hidden = false;

  function success(rsp) {
    let div = document.createElement("div");
    div.innerText = "Succes! ";
    div.setAttribute("style", "color: green");
    let a = document.createElement("a");
    a.innerText = "See new item";
    a.setAttribute("href", `/item/${rsp.id}`);
    div.appendChild(a);
    addBefore("console", div);
    clearForm(form);
  };

  function fail(rsp) {
    let div = document.createElement("div");
    div.innerText = `Failure! (${rsp})`;
    div.setAttribute("style", "color: red");
    addBefore("console", div);
  };

  putNewItem(item, success, fail);
}

function buttonUpdateItem(id) {
  function getValues(item) {
    form = document.getElementById("itemUpdate");
    for (e of form.elements) {
      switch(e.name) {
        case "name":
          if (e.value != "")
            item.name = e.value;
          break;
        case "price":
          if (e.value != "")
            item.price = e.value;
          break;
        case "amount":
          if (e.value != "")
            item.amount = e.value;
          break;
        case "available":
          item.available = e.checked;
          break
        case "visible":
          item.hidden = !e.checked;
      }
    }
    console.log(item);
    updateItem(item, (x) => { clearForm(form); insertItemUpdate(id); }, console.log);
  }
  /* first we get item data to change only modified fields
   * next we get values from form and change modified fields
   * then we clear form and update item info
   */
  getItemById(id, getValues, console.log);
}
