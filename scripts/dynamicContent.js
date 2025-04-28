const dynamicContent = {
    _main: `
        <div class="setting">
            <h5>Funkcja: Skrót</h5>
            <h5>+ALT?</h5>
        </div>       
        <div class="setting">
            <label class="setting-label" for="reset-and-search">Rozpocznij wyszukiwanie: 
                <input class="setting-inp-key" name="resetAndSearch" data-name="resetAndSearch" id="reset-and-search" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="resetAndSearch" data-name="resetAndSearch"> 
        </div>
        <div class="setting">
            <label class="setting-label" for="search">Kontynuuj wyszukiwanie: 
                <input class="setting-inp-key" name="search" data-name="search" id="search" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="search" data-name="search"> 
        </div>
        <div class="setting">
            <label class="setting-label" for="z-top">Przenieś BB na wierzch: 
                <input class="setting-inp-key" name="zTop" data-name="zTop" id="z-top" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="zTop" data-name="zTop"> 
        </div>
        <div class="setting">
            <label class="setting-label" for="z-bot">Przenieś BB na spód: 
                <input class="setting-inp-key" name="zBot" data-name="zBot" id="z-bot" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="zBot" data-name="zBot"> 
        </div>
        <div class="setting">
            <label class="setting-label" for="q-search">Wyszukaj podobne:  
                <input class="setting-inp-key" name="quickSearch" data-name="quickSearch" id="q-search" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="quickSearch" data-name="quickSearch"> 
        </div>
        <div class="setting">
            <label class="setting-label" for="nav-up">Wybierz klasę z listy (góra): 
                <input class="setting-inp-key" name="navUp" data-name="navUp" id="nav-up" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="navUp" data-name="navUp"> 
        </div>
        <div class="setting">
            <label class="setting-label" for="nav-down">Wybierz klasę z listy (dół): 
                <input class="setting-inp-key" name="navDown" data-name="navDown" id="nav-down" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="navDown" data-name="navDown"> 
        </div>
        <div class="setting">
            <label class="setting-label" for="destroy-bb">Usuń wybrany BB: 
                <input class="setting-inp-key" name="destroyBB" data-name="destroyBB" id="destroy-bb" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="destroyBB" data-name="destroyBB">
        </div>
        <div class="setting">
            <label class="setting-label" for="change-mode">Zmień tryb: 
                <input class="setting-inp-key" name="mode" data-name="mode" id="change-mode" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="mode" data-name="mode">
        </div>
        <div class="setting">
            <label class="setting-label" for="visiblity">Wyświetl/schowaj boxy: 
                <input class="setting-inp-key" name="visiblity" data-name="visiblity" id="visiblity" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="visiblity" data-name="visiblity">
        </div>
        <div class="setting">
            <label class="setting-label" for="ettiq">Wyświetl/schowaj etykiety: 
                <input class="setting-inp-key" name="ettiq" data-name="ettiq" id="ettiq" maxlength="1" type="text">
            </label>
            <input class="setting-checkbox" type="checkbox" name="ettiq" data-name="ettiq">
        </div>
        <div class="setting">
            <label class="setting-label" for="disp-ttip-period">Okres czasu po jakim wyświetla się wzorzec (1=100ms): 
                <input class="setting-inp-key" name="displayTTipPeriod" id="disp-ttip-period" maxlength="1" type="text">
            </label>
        </div>
        <div class="setting flex-col">
            <p class="setting-title">Ustaw rozmiar wzorców</p>
            <input class="setting-inp-key" 
                style="width: 45px;" 
                name="tooltipSize" 
                id="tooltip-size" 
                type="number" 
                title="Dopuszczalne są wartości w zakresie od 1 do 30"
            >
        </div>
    `,
    _custom: `
        <div class="flex-row custom-filter-groups">
            <div id="nav-left" class="nav-arrow hidden">\<</div>
            <div id="dynamic-groups">
                
            </div>
            <div id="nav-right" class="nav-arrow hidden">\></div>
            <button type="button" id="new-group" class="content-btn">+</button>
        </div>
        <div class="btn-container">
            <div class="expand-anim hide-l">
                <input id="import-group-inp" type="text">
                <button type="button" class="manage-btn" id="import-group-conf">&#10004;</button>
                <button type="button" class="manage-btn" id="import-group-canc">&#10006;</button>
            </div>
            <button type="button" class="manage-btn expand-anim" id="copy-group">Skopiuj grupę</button>
            <button type="button" class="manage-btn expand-anim" id="import-group">Importuj</button>
            <button type="button" class="manage-btn expand-anim" id="delete-group">Usuń grupę</button>
        </div>
        <div class="setting">
            <h5>Wpisz własny filtr wysz.</h5>
            <h5>Skrót</h5>
            <h5>+ALT?</h5>
            <h5>Usuń</h5>
        </div>
        <div id="dynamic-filters">
        
        </div>
        <div class="btn-container">
            <button type="button" class="content-btn" id="new-filter">+</button>
        </div>
    `,
    _attrs: `
        <div class="setting">
            <h5 id="project-name" style="width: 100%;">
            
            </h5>
        </div>
        <div id="dynamic-attributes">
        
        </div>
    `,
    _funcs: `
        <div class="setting">
            <h5>Funkcja</h5>
            <h5>Wł/Wył</h5>
        </div>
        <div class="setting">
            <label title="Działa dopiero po odświeżeniu strony" class="setting-label" for="turn-off">Wyłącz rozszerzenie</label>
            <input class="setting-checkbox" name="isOff" type="checkbox" id="turn-off">
        </div>
        <div class="setting">
            <label class="setting-label" for="nav-by-arrows">Nawigacja po liście klas strzałkami</label>
            <input class="setting-checkbox" name="navByArrows" type="checkbox" id="nav-by-arrows">
        </div>
        <div class="setting">
            <label class="setting-label" for="show-ttip">Pokazywanie wzorca po najechaniu</label>
            <input class="setting-checkbox" name="showTTip" type="checkbox" id="show-ttip">
        </div>
        <div class="setting">
            <label class="setting-label" for="show-attributes">Wyświetlanie atrybutów</label>
            <input class="setting-checkbox" name="showAttributes" type="checkbox" id="show-attributes">
        </div>
        <div class="setting">
            <label class="setting-label" for="show-grammage">Wyświetlanie gramatury </label>
            <input class="setting-checkbox" name="showGrammage" type="checkbox" id="show-grammage">
        </div>
        <div class="setting">
            <label class="setting-label" for="inform-when-more-blobs">Informowanie o liczbie wzorców</label>
            <input class="setting-checkbox" name="informWhenMoreBlobs" type="checkbox" id="inform-when-more-blobs">
        </div>
        <div class="setting">
            <label title="Wyłączenie tej funkcji oznacza zmniejszenie liczby dostępnych skrótów tj. 'Alt + E'" 
                class="setting-label text-left" 
                for="prevent-default"
            >
                Blokuj skróty przeglądarki wykorzystujące klawisz Alt
            </label>
            <input class="setting-checkbox" name="preventDefault" type="checkbox" id="prevent-default">
        </div>
        <div class="setting">
            <label class="setting-label" for="show-warnings-on-group-delete">Potwierdzaj usunięcie grupy</label>
            <input class="setting-checkbox" name="showWarningOnGroupDelete" type="checkbox" id="show-warnings-on-group-delete">
        </div>
    `
};

export {dynamicContent};