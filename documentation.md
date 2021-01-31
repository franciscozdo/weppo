# Projekt WEPPO -- Dokumentacja
Autorzy: Franciszek Zdobylak (310313) i Paweł Jasiak ()

Aplikacja weppo to prosta imitacja sklepu internetowego. Udostępnia ona proste akcje potrzebne
w takiej aplikacji.

## Opis funkcjonalności

Dla niezalogowanych użytkowników:
* wyświetlenie listy towarów
* wyświetlenie szczegółów konkretnego towaru
* możliwość zalogowania/rejestracji

Dla zalogowanych użytkowników:
* możliwość dodania towaru do koszyka w różnej ilości
* możliwość usunięcia towaru z koszyka
* wyświetlenie swoich zamówień
* wyświetlenie konkretnego zamówienia (w tym koszyka)
* możliwość zapłacenia za zamówienie

Dla administratora:
* możliwość ukrycia niektórych towarów
* możliwość dodania i modyfikacji towaru
* wyświetlenie listy użytkowników
* wyświetlenie szczegółów danego użytkownika
* wyświetlenie listy wszystkich zamówień
* wyświetlenie szczegółów dowolnego zamówienia

Udostępniamy do testowania dwa konta:
|    email    |   hasło  |
|:-----------:|:--------:|
| admin@weppo | admin123 |
| user@weppo  | user123  |

## Opis dostępnych endpointów

| Adres          |\*| Opis |
|:--------------:|--|:-----|
|/               |  | Główna strona.
|/register       |  | Strona rejestracji.
|/login          |  | Strona logowania.
|/logout         |  | Akcja wylogowania się.
|/list/item      |  | Lista wszystkich towarów
|/item/:id       |  | Towar o konkretnym id.
|/order/:id      |LA| Zamówienie o numerze id.
|/orders         |L | Wszystkie zamówienia zalogowanego użytkownika.
|/cart           |L | Koszyk.
|/account        |L | Szczegóły konta zalogowanego użytkownika.
|/add/item       |A | Dodawanie przedmiotu.
|/update/item/:id|A | Aktualizacja danych przedmiotu.
|/orders/all     |A | Wszystkie zamówienia.
|/orders/:id     |A | Zamówienia użytkownika o numerze id.
|/users          |A | Lista użytkowników.
|/user/:user\_id |A | Szczegóły użytkownika o id.
|/admin          |A | Panel administratora.

## Opis implementacji

### Backend

Zapytania do API

|Metoda|\*|URL|Opis|Wynik|
|:----:|-|:--:|:--:|:----|
|GET   |L|'/api/v1/user/me'|Pobierz dane zalogowanego użytkownika.|user|
|GET   |A|'/api/v1/user/by\_id/:user\_id'|Pobierz dane dowolnego użytkownika (wg id).|user|
|GET   |A|'/api/v1/user/list'|Pobierz listę użytkowników.|[str]|
|GET   |A|'/api/v1/role/list'|Pobierz listę ról.|[str]|
|PUT   |A|'/api/v1/role/add/:role'|Dodaj rolę.|-|
|PUT   |A|'/api/v1/user/:user\_id/role/add/:role\_id'|Przypisz rolę użytkownikowi.|-|
|PUT   |A|'/api/v1/item/add'|Dodaj przedmiot.|-|
|PUT   |A|'/api/v1/item/update'|Zmodyfikuj przedmiot. (ustawiane są wszystkie pola oprócz id.)|-|
|GET   |-|'/api/v1/item/list'|Pobierz listę przedmiotów.|[item]|
|GET   |-|'/api/v1/item/:item\_id'|Pobierz dane przedmiotu.|item|
|PUT   |A|'/api/v1/discount/add'|Dodaj zniżkę.|-|
|DELETE|A|'/api/v1/discount/delete/:discount\_id'|Usuń zniżkę.|-|
|GET   |-|'/api/v1/discount/list/:item\_id'|Pobierz wszystkie zniżki przypisane do przedmiotu.|[discount]|
|GET   |L|'/api/v1/order/get'|Pobierz id aktualnego zamówienia (koszyka).|int|
|PUT   |L|'/api/v1/order/create'|Stwórz nowe zamówienie. (zwracane id)|-|
|PUT   |L|'/api/v1/order/add/:item\_id/:amount'|Dodaj przedmiot do koszyka (w podanej ilości).|-|
|DELETE|L|'/api/v1/order/delete/:order\_id/:item\_order\_id'|Usuń przedmiot z zamówienia.|-|
|GET   |L|'/api/v1/order/user/:user\_id/list'|Pobierz zamówienia użytkownika. (Nie-admin może pobrać tylko swoje zamówienia).|[order]|
|PUT   |L|'/api/v1/order/pay/:order\_id'|Zapłać za zamówienie.|-|
|GET   |L|'/api/v1/order/list/:order\_id'|Wyświetl przedmioty zamówienia.|[order\_item]|
|GET   |A|'/api/v1/order/all'|Wyświetl wszystkie zamówienia.|[order]|
|GET   |L|'/api/v1/order/:order\_id/price'|Podaj wartość zamówienia.|price|

> Druga kolumna mówi o dostępie do danego wywołania API.
> (L - zalogowany użytkownik, A - administrator)

Wszystkie zapytania do API zwracają wynik w formacie JSON.

```
user = {
    id -- int,
    email -- str,
    name -- str,
    address -- str,
    roles -- [str]
}

item = {
    id -- int,
    name -- str,
    price -- int,
    amount -- int,
    available -- bool,
    hidden -- bool
}

discount = {
    id -- int,
    item_id -- int,
    discount -- float,
    rule -- str
}

order = {
    id -- int,
    user_id -- int,
    paid -- bool
}

order_item = {
    id -- int,
    item_order_id -- int,
    name -- str,
    price -- int,
    amount -- int
}

price = {
    price -- int
}
```

Dane przechowywane są w bazie PostgreSQL.

### Frontend
Tworzenie treści, które wyświetlają się na ekranie można podzielić na dwie części:
1. Renderowanie szkieletu (a czasem całej) strony przez Express'a.
2. Uzupełnianie treści przez JS po stronie klienta (przez asynchroniczne zapytania do API
  udostępnionego przez backend. Zapytania korzystają ze stylu przekazywania kontynuacji i 
  w zależności od tego czy zapytanie się powiodło uruchamiana jest odpowiednia funkcja
  (`success` i `fail`).

Interfejs jest bardzo prosty i oparty na czystym HTMLu z lekką domieszką CSS'a.
