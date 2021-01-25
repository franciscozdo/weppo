function insert(name, value) {
  document.getElementById(name).innerHTML = value
}

function append(name, node) {
  document.getElementById(name).appendChild(node);
}

function checkbox(name, checked) {
 document.getElementById(name).checked = checked;
}

function addBefore(name, node) {
  let elem = document.getElementById(name);
  elem.parentNode.insertBefore(node, elem);
}

function clearForm(form) {
  for (e of form.elements) {
    e.value = "";
  }
}

