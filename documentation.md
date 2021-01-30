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


## Opis implementacji

### Backend

Zapytania do API

|Metoda|\*|URL|Opis|
|:----:|-|:--:|:---|
|GET   |L|'/api/v1/user/me'|Pobierz dane zalogowanego użytkownika.|
|GET   |A|'/api/v1/user/by\_id/:user\_id'|Pobierz dane dowolnego użytkownika (wg id) |
|GET   |A|'/api/v1/user/list'|Pobierz listę użytkowników.|
|GET   |A|'/api/v1/role/list'|Pobierz listę ról.|
|PUT   |A|'/api/v1/role/add/:role'|Dodaj rolę.|
|PUT   |A|'/api/v1/user/:user\_id/role/add/:role\_id'|Przypisz rolę użytkownikowi.|
|PUT   |A|'/api/v1/item/add'|Dodaj przedmiot.|
|PUT   |A|'/api/v1/item/update'|Zmodyfikuj przedmiot. (ustawiane są wszystkie pola oprócz id.)|
|GET   |-|'/api/v1/item/list'|Pobierz listę przedmiotów.|
|GET   |-|'/api/v1/item/:item\_id'|Pobierz dane przedmiotu.|
|PUT   |A|'/api/v1/discount/add'|Dodaj zniżkę.|
|DELETE|A|'/api/v1/discount/delete/:discount\_id'|Usuń zniżkę.|
|GET   |-|'/api/v1/discount/list/:item\_id'|Pobierz wszystkie zniżki przypisane do przedmiotu.|
|GET   |L|'/api/v1/order/get'|Pobierz id aktualnego zamówienia (koszyka).|
|PUT   |L|'/api/v1/order/create'|Stwórz nowe zamówienie. (zwracane id)|
|PUT   |L|'/api/v1/order/add/:item\_id/:amount'|Dodaj przedmiot do koszyka (w podanej ilości).|
|DELETE|L|'/api/v1/order/delete/:order\_id/:item\_order\_id'|Usuń przedmiot z zamówienia.|
|GET   |L|'/api/v1/order/user/:user\_id/list'|Pobierz zamówienia użytkownika. (Nie-admin może pobrać tylko swoje zamówienia).|
|PUT   |L|'/api/v1/order/pay/:order\_id'|Zapłać za zamówienie.|
|GET   |L|'/api/v1/order/list/:order\_id'|Wyświetl przedmioty zamówienia.|
|GET   |A|'/api/v1/order/all'|Wyświetl wszystkie zamówienia.|
|GET   |L|'/api/v1/order/:order\_id/price'|Podaj wartość zamówienia.|

> Druga kolumna mówi o dostępie do danego wywołania API.
> (L - zalogowany użytkownik, A - administrator)

Wszystkie zapytania do API zwracają wynik w formacie JSON.

Dane przechowywane są w bazie PostgreSQL.

### Frontend
Tworzenie treści, które wyświetlają się na ekranie można podzielić na dwie części:
1. Renderowanie szkieletu (a czasem całej) strony przez Express'a.
2. Uzupełnianie treści przez JS po stronie klienta (przez asynchroniczne zaytania do API 
  udostępnionego przez backend. Zapytania korzystają ze stylu przekazywania kontynuacji i 
  w zależności od tego czy zapytanie się powiodło uruchamiana jest odpowiednia funkcja
  (`success` i `fail`).

Interfejs jest bardzo prosty i oparty na czystym HTMLu z lekką domieszką CSS'a.
