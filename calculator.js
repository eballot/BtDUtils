/*
 Given a defense value and a list of attack values, this algo determines the set of up to 5 attack values that sum
 to a value larger than the defense value.
 
 Original source at https://github.com/eballot/BtDUtils
 
 1. sort hi->low
 2. remove any values > targetValue (except last one)
 3. if only one left, use that
 4.
//a + b + c + d
//a + c + d
//a + d
//b + c + d
//b + d
*/

document.addEventListener("DOMContentLoaded", function(event) {
    calculator.init();
});

var calculator = {

    init: function() {        
        this._compileTemplates();
        this._loadSurvivorList();
        this._renderSurvivors();
        // Messy because it never removes the listener, but that's okay since the listener needs to be
        // active during the lifetime of the page.
        document.body.addEventListener('click', this._onClick.bind(this));
        document.getElementById('attack-value-input').addEventListener('keyup', this._onKeyUpOfAttackValueInput.bind(this));
        document.getElementById('foe-defense-value-input').addEventListener('keyup', this._onKeyUpOfFoeDefenseValueInput.bind(this));
    },

    calculateParty: function(targetValue) {
        this.possibilitiesHash = {};
        targetValue = this._inputStringToNumericValue(targetValue);

        this._doCalculation([], this._survivorsList, targetValue);
        var foo = Object.keys(this.possibilitiesHash).sort(function compareNumbers(a, b) { return a.attack - b.attack; });
        this._renderBestPartyResult(targetValue, foo[0], this.possibilitiesHash[foo[0]]);
    },

    _onClick: function(event) {
        var dataset, action, element;
        
        dataset = event.target.dataset;
        if (dataset) {
            var action = dataset.action;
        
            switch (action) {
            case 'addSurvivor':
                element = document.getElementById('attack-value-input');
                this._addToSurvivorList(element.value);
                element.value = '';
                this._renderSurvivors();
                break;
            case 'removeSurvivor':
                this._removeFromSurvivorList(dataset.index);
                this._renderSurvivors();
                break;
            case 'calcAttackParty':
                element = document.getElementById('foe-defense-value-input');
                this.calculateParty(element.value);
                element.value = '';
                break;
            }
        }
    },

    _onKeyUpOfAttackValueInput: function(event) {
        var element;
        if (event.keyCode === 13) {
            element = event.target;
            this._addToSurvivorList(element.value);
            element.value = '';
            this._renderSurvivors();
        }
    },

    _onKeyUpOfFoeDefenseValueInput: function(event) {
        var element;
        if (event.keyCode === 13) {
            element = event.target;
            this.calculateParty(element.value);
            element.value = '';
        }
    },

    _compileTemplates: function() {
        var source = document.getElementById('template-survivor-list');
        this._templateSurvivorList = Handlebars.compile(source.innerHTML);

        source = document.getElementById('template-best-parties-list');
        this._templateBestPartyList = Handlebars.compile(source.innerHTML);
    },

    _renderSurvivors: function() {
        var container = document.getElementById('survivor-list-container');
        container.innerHTML = this._templateSurvivorList({survivors: this._survivorsList});
    },

    _renderBestPartyResult: function(defenseValue, partyAttack, results) {
        var container = document.getElementById('best-party-container');
        container.innerHTML = this._templateBestPartyList({
            defense: defenseValue,
            partyAttack: partyAttack,
            survivors: results
        });
    },

    _loadSurvivorList: function() {
        this._survivorsList = localStorage.getItem('survivorList');
        if (this._survivorsList) {
            this._survivorsList = JSON.parse(this._survivorsList);
        } else {
            this._survivorsList = [];
        }
    },
    
    _storeSurvivorList: function() {
        localStorage.setItem('survivorList', JSON.stringify(this._survivorsList));
    },

    _sortSurvivorList: function() {
        this._survivorsList.sort(function compareNumbers(a, b) {
            return b.attack - a.attack;
        });
    },

    _addToSurvivorList: function(attackValue) {
        attackValue = this._inputStringToNumericValue(attackValue);
        if (attackValue) {
            this._survivorsList.push({attack:attackValue});
            this._sortSurvivorList();
            this._storeSurvivorList();
        }
    },

    _removeFromSurvivorList: function(index) {
        this._survivorsList.splice(index, 1);
        this._sortSurvivorList();
        this._storeSurvivorList();
    },

    _doCalculation: function(partyList, survivorList, targetValue) {
        var i,
            maxPartySize = 5,
            totalAttackValue,
            workingSurvivorList,
            workingPartyList;
//            copyOfList = list.slice(1),
//            party = [list[0]];
        
        // partyList is already full
        if (partyList.length > 4) {
            return;
        }
        
        workingSurvivorList = this._copyArray(survivorList);
        
        for (i = 0; i < survivorList.length; i++) {
            workingPartyList = this._copyArray(partyList);
            workingPartyList.push(survivorList[i]);
            workingSurvivorList.splice(0, 1);
            totalAttackValue = this._sumSurvivors(workingPartyList);
            if (totalAttackValue > targetValue && !this.possibilitiesHash[totalAttackValue]) {
                this.possibilitiesHash[totalAttackValue] = workingPartyList;
            } else if (workingPartyList.length < 5) {
                this._doCalculation(workingPartyList, workingSurvivorList, targetValue);
            }
        }
    },
    
    _sumSurvivors: function(list) {
        var sum = 0;
        list.forEach(function(survivor) {
            sum += survivor.attack; //TODO: get the survivor's attack value
        });
        return sum;
    },

    _inputStringToNumericValue: function(value) {
        if (typeof value === 'string') {
            // Remove any thousands markers. Look for either dot or comma since either could be used based on locale.
            value = (value.split(/\.|,/).join(''));
        }
        // Now convert to integer
        return ~~value;
    },

    _copyArray: function(source) {
        return source.slice(0);
    }
};
