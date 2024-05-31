class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
        this.rates = {}; // Almacenar las tasas de cambio una vez obtenidas
    }

    async getCurrencies() {
        try {
            const response = await fetch(`${this.apiUrl}/currencies`);
            if (!response.ok) {
                throw new Error(`Error al cargar las divisas: ${response.statusText}`);
            }
            const currenciesData = await response.json();
            this.currencies = Object.keys(currenciesData).map((code) => {
                return new Currency(code, currenciesData[code]);
            });
        } catch (error) {
            console.error("Error en getCurrencies:", error);
        }
    }

    async getRatesForDate(date) {
        try {
            const response = await fetch(`${this.apiUrl}/${date}`);
            if (!response.ok) {
                throw new Error(`Error al obtener las tasas de cambio para la fecha ${date}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.rates;
        } catch (error) {
            console.error(`Error al obtener las tasas de cambio para la fecha ${date}:`, error);
            return null;
        }
    }

    async getDifferenceBetweenTodayAndYesterday() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        try {
            const ratesToday = await this.getRatesForDate(todayStr);
            const ratesYesterday = await this.getRatesForDate(yesterdayStr);
            if (!ratesToday || !ratesYesterday) {
                console.error("No se pudieron obtener las tasas de cambio para hoy o ayer.");
                return null;
            }

            const currencies = Object.keys(ratesToday);
            const difference = {};
            currencies.forEach((currency) => {
                console.log(currency, ratesToday[currency], ratesYesterday[currency])
                if (ratesYesterday[currency]) {
                    difference[currency] = ratesToday[currency] - ratesYesterday[currency];
                }
            });
            return difference;
        } catch (error) {
            console.error("Error al calcular la diferencia entre las tasas de cambio de hoy y ayer:", error);
            return null;
        }
    }

    /**
     * Obtiene las tasas de cambio más recientes
     * @returns {Promise<void>}
     */
    async fetchRates() {
        try {
            const response = await fetch(`${this.apiUrl}/latest`);
            if (!response.ok) {
                throw new Error(`Error al obtener las tasas de cambio: ${response.statusText}`);
            }
            const data = await response.json();
            this.rates = data.rates;
        } catch (error) {
            console.error("Error al obtener las tasas de cambio:", error);
        }
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency.code === toCurrency.code) {
            return amount;
        }

        if (!this.rates[fromCurrency.code] || !this.rates[toCurrency.code]) {
            console.error(`No se encontraron tasas de cambio para ${fromCurrency.code} o ${toCurrency.code}`);
            return null;
        }

        const fromRate = this.rates[fromCurrency.code];
        const toRate = this.rates[toCurrency.code];
        return (amount / fromRate) * toRate;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");
    const differenceButton = document.getElementById("difference-button");
    const differenceResultDiv = document.getElementById("difference-result");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    await converter.fetchRates();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrencyCode = fromCurrencySelect.value;
        const toCurrencyCode = toCurrencySelect.value;

        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencyCode
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencyCode
        );

        const convertedAmount = converter.convertCurrency(
            parseFloat(amount),
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            resultDiv.textContent = `${amount} ${fromCurrency.code} son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;
            resultDiv.style.display = "block";
        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
            resultDiv.style.display = "block";
        }
    });

    differenceButton.addEventListener("click", async () => {
        toggleButtonText(differenceButton);

        if (differenceResultDiv.style.display === "block") {
            differenceResultDiv.style.display = "none";
            return;
        }

        const difference = await converter.getDifferenceBetweenTodayAndYesterday();
        differenceResultDiv.innerHTML = "";

        if (difference !== null) {
            Object.keys(difference).forEach((currency) => {
                const diffElement = document.createElement("p");
                diffElement.textContent = `${currency}: ${difference[currency].toFixed(4)}`;
                differenceResultDiv.appendChild(diffElement);
            });
            differenceResultDiv.style.display = "block";
        } else {
            differenceResultDiv.textContent = "Error al calcular la diferencia.";
            differenceResultDiv.style.display = "block";
        }
    });

    function toggleButtonText(button) {
        if (button.textContent === "Ocultar diferencia Hoy vs. Ayer") {
            button.textContent = "Mostrar diferencia Hoy vs. Ayer";
        }
        else {
            button.textContent = "Ocultar diferencia Hoy vs. Ayer";
        }

    }

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});
