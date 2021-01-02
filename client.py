#!/usr/bin/env python3

import readline, cmd

import json
import re
import requests
import sys

class Commands():
  def __init__(self, base):
    self._base = base
    self._id = None
    self._session = requests.Session()
    self._re_dec = re.compile(r'\d+')

  def _make_uri(self, path):
    uri = ''.join(('https://', self._base, path))
    return uri

  def _dict_parser(self, line):
    d = {}
    for key, value in map(lambda x : x.split(':'), line.split()):
      d[key] = value
    return d

  #############################################################################

  def _parse_login(self, rsp):
    ids = [self._re_dec.findall(text) for text in filter(lambda text: 'your user id is ' in text, rsp.content.decode('utf-8').split('\n'))]
    if len(ids) != 1:
      return False
    ids = ids[0]
    if len(ids) != 1:
      return False
    self._id = ids[0]
    return True

  def register(self, name, address, email, passwd):
    uri = self._make_uri('/register')
    data = {
      'name': name,
      'address': address,
      'email': email,
      'passwd': passwd,
      'repasswd': passwd
    }
    rsp = self._session.post(uri, data=data)
    return self._parse_login(rsp)

  def login(self, user, passwd):
    uri = self._make_uri('/login')
    data = {
        'email': user,
        'passwd': passwd
    }
    rsp = self._session.post(uri, data=data)
    return self._parse_login(rsp)

  def logout(self):
    uri = self._make_uri('/logout')
    self._session.get(uri)
    self._id = None
    return True

  #############################################################################

  def role_add(self, role):
    uri = self._make_uri('/api/v1/role/add/%s' % role)
    rsp = self._session.put(uri)
    return rsp.status_code == 200

  def user_role_add(self, user, role):
    uri = self._make_uri('/api/v1/user/%s/role/add/%s' % role)
    rsp = self._session.put(uri)
    return rsp.status_code == 200

  #############################################################################
  
  def item_add(self, line):
    uri = self._make_uri('/api/v1/item/add')
    item = self._dict_parser(line)
    rsp = self._session.put(uri, json=item)
    return rsp.status_code == 200

  def item_update(self, line):
    uri = self._make_uri('/api/v1/item/update')
    item = self._dict_parser(line)
    rsp = self._session.put(uri, json=item)
    return rsp.status_code == 200

  def item_list(self):
    uri = self._make_uri('/api/v1/item/list')
    rsp = self._session.get(uri)
    items = json.loads(rsp.content.decode('utf-8'))
    return items
  
  #############################################################################

  def discount_add(self, line):
    uri = self._make_uri('/api/v1/discount/add')
    discount = self._dict_parser(line)
    rsp = self._session.put(uri, json=discount)
    return rsp.status_code == 200

  def discount_list(self, item_id):
    uri = self._make_uri('/api/v1/discount/list/%s' % (item_id))
    rsp = self._session.get(uri)
    discounts = json.loads(rsp.content.decode('utf-8'))
    return discounts

  def discount_delete(self, discount_id):
    uri = self._make_uri('/api/v1/discount/delete/%s' % (discount_id))
    rsp = self._session.delete(uri)
    return rsp.status_code == 200

  #############################################################################

  def order_create(self):
    uri = self._make_uri('/api/v1/order/create')
    rsp = self._session.put(uri)
    if rsp.status_code == 200:
      return json.loads(rsp.content.decode('utf-8'))['id']
    return -1

  def order_add(self, order_id, item_id):
    uri = self._make_uri('/api/v1/order/add/%s/%s' % (order_id, item_id))
    rsp = self._session.put(uri)
    return rsp.status_code == 200

  def order_list(self, user_id):
    uri = self._make_uri('/api/v1/order/user/%s/list' % (user_id))
    rsp = self._session.get(uri)
    orders = json.loads(rsp.content.decode('utf-8'))
    return orders

  def order_pay(self, order_id):
    uri = self._make_uri('/api/v1/order/%s/pay' % (order_id))
    rsp = self._session.put(uri)
    return rsp.status_code == 200

  def order_item_list(self, order_id):
    uri = self._make_uri('/api/v1/order/list/%s' % (order_id))
    rsp = self._session.get(uri)
    items = json.loads(rsp.content.decode('utf-8'))
    return items

  def order_delete(self, order_id, item_id):
    uri = self._make_uri('/api/v1/order/delete/%s/%s' % (order_id, item_id))
    rsp = self._session.delete(uri)
    return rsp.status_code == 200

  #############################################################################

  def get_id(self):
    return self._id

  def build_prompt(self):
    prompt = ''
    if self._id is not None:
      prompt += '%s@' % (self._id)
    if self._base is not None:
      prompt += '%s' % (self._base)
    if len(prompt) > 0:
      prompt = ' [' + prompt + ']'
    return prompt
  
###############################################################################

class WeppoCli(cmd.Cmd):
  def __init__(self, base):
    cmd.Cmd.__init__(self)
    self._c = Commands(base)
    self._update_prompt()

  def _update_prompt(self):
    self.prompt = '(weppo%s)> ' % (self._c.build_prompt())

  def UpdatePrompt(func):
    def _wrap(self, *args, **kwargs):
      func(self, *args, **kwargs)
      self._update_prompt()
      return False
    return _wrap

  def _exit(self):
    print('>>> bye, bye...')
    return True

  def _sif(self, retval):
    if retval:
      print('>>> success')
    else:
      print('>>> failure')
  
  #############################################################################

  @UpdatePrompt
  def do_register(self, line):
    name, address, email, passwd = line.split()
    if self._c.register(name, address, email, passwd):
      print('>>> success; your user id is %s' % (self._c.get_id()))
    else:
      print('>>> failure')

  @UpdatePrompt
  def do_login(self, line):
    user, passwd = line.split()
    if self._c.login(user, passwd):
      print('>>> success; your user id is %s' % (self._c.get_id()))
    else:
      print('>>> failure')

  @UpdatePrompt
  def do_logout(self, line):
    self._c.logout()

  @UpdatePrompt
  def do_role_add(self, line):
    role = ''.join(line.split())
    self._sif(self._c.role_add(role))

  @UpdatePrompt
  def do_user_role_add(self, line):
    user, role = line.split()
    self._sif(self._c.user_role_add(user, role))

  @UpdatePrompt
  def do_item_add(self, line):
    self._sif(self._c.item_add(line))

  @UpdatePrompt
  def do_item_update(self, line):
    self._sif(self._c.item_update(line))

  @UpdatePrompt
  def do_item_list(self, line):
    rsp = self._c.item_list();
    for item in rsp:
      print(item)

  @UpdatePrompt
  def do_discount_add(self, line):
    self._sif(self._c.discount_add(line))

  @UpdatePrompt
  def do_discount_list(self, line):
    item_id = int(line)
    rsp = self._c.discount_list(item_id)
    for item in rsp:
      print(item)

  @UpdatePrompt
  def do_discount_delete(self, line):
    discount_id = int(line)
    self._sif(self._c.discount_delete(discount_id))

  @UpdatePrompt
  def do_order_create(self, line):
    rsp = self._c.order_create()
    if rsp != -1:
      print('>>> success; order id is %s' % (rsp))
    else:
      print('>>> failure')

  @UpdatePrompt
  def do_order_add(self, line):
    order_id, item_id = line.split()
    self._sif(self._c.order_add(order_id, item_id))

  @UpdatePrompt
  def do_order_list(self, line):
    user_id = int(line)
    rsp = self._c.order_list(user_id)
    for order in rsp:
      print(order)

  @UpdatePrompt
  def do_order_pay(self, line):
    order_id = int(line)
    self._sif(self._c.order_pay(order_id));

  @UpdatePrompt
  def do_order_item_list(self, line):
    order_id = int(line)
    rsp = self._c.order_item_list(order_id)
    for item in rsp:
      print(item)

  @UpdatePrompt
  def do_order_delete(self, line):
    order_id, item_id = line.split();
    self._sif(self._c.order_delete(order_id, item_id))

  #############################################################################

  def do_quit(self, line):
    return self._exit()

  def do_EOF(self, line):
    return self._exit()

###############################################################################

def main():
  if len(sys.argv) != 2:
    print('>>> usage: %s weppo.domain' % (sys.argv[0]))
    sys.exit(1)

  WeppoCli(sys.argv[1]).cmdloop()

if __name__ == '__main__':
  main()
