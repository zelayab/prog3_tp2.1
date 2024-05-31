class Sensor {
    constructor(id, name, type, value, unit, updated_at) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.value = value;
        this.unit = unit;
        this.updated_at = updated_at;
    }

    set updateValue(newValue) {
        this.value = newValue;
        this.updated_at = new Date().toISOString();
    }

    static get ALLOWED_TYPES() {
        return ['temperature', 'humidity', 'pressure'];
    }

    set type(newType) {
        if (Sensor.ALLOWED_TYPES.includes(newType)) {
            this._type = newType;
        } else {
            throw new Error(`Invalid sensor type: ${newType}`);
        }
    }

    get type() {
        return this._type;
    }
}

class SensorManager {
    constructor() {
        this.sensors = [];
    }

    addSensor(sensor) {
        this.sensors.push(sensor);
    }

    /**
    * Actualiza el valor de un sensor con un valor aleatorio
    * @param {number} id - ID del sensor a actualizar
    * @returns {void}
    */
    updateSensor(id) {
        const sensor = this.sensors.find((sensor) => sensor.id === id);
        if (sensor) {
            let newValue;
            switch (sensor.type) {
                case 'temperature': // Rango de -30 a 50 grados Celsius
                    newValue = (Math.random() * 80 - 30).toFixed(2);
                    break;
                case 'humidity': // Rango de 0 a 100%
                    newValue = (Math.random() * 100).toFixed(2);
                    break;
                case 'pressure': // Rango de 960 a 1040 hPa (hectopascales o milibares)
                    newValue = (Math.random() * 80 + 960).toFixed(2);
                    break;
                default: // Valor por defecto si el tipo es desconocido
                    newValue = (Math.random() * 100).toFixed(2);
            }
            sensor.updateValue = newValue;
            this.render();
        } else {
            console.error(`Sensor ID ${id} no encontrado`);
        }
    }

    /**
    * Carga los sensores desde una URL y los añade al listado de sensores
    * @param {string} url - URL de la API de sensores
    * @returns {Promise<void>}
    */

    async loadSensors(url) {
        try {
            console.log("Cargando sensores desde:", url);
            console.log("Visualizando sensores de prueba");
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error al cargar los sensores: ${response.statusText}`);
            }
            const sensorsData = await response.json();
            sensorsData.forEach(sensorData => {
                const { id, name, type, value, unit, updated_at } = sensorData;
                const sensor = new Sensor(id, name, type, value, unit, updated_at);
                this.addSensor(sensor);
            });
            this.render();
        } catch (error) {
            console.log("Visualizando sensores de prueba");
            console.error("Error en loadSensors:", error);
        }
    }

    /**
    * Renderiza los sensores en el contenedor correspondiente
    * @returns {void}
    */
    render() {
        const container = document.getElementById('sensor-container');
        container.innerHTML = '';
        this.sensors.forEach((sensor) => {
            const sensorCard = document.createElement('div');
            sensorCard.className = 'column is-one-third';
            sensorCard.innerHTML = `
                <div class="card">
                    <header class="card-header">
                        <p class="card-header-title">
                            Sensor ID: ${sensor.id}
                        </p>
                    </header>
                    <div class="card-content">
                        <div class="content">
                            <p><strong>Nombre:</strong> ${sensor.name}</p>
                            <p><strong>Tipo:</strong> ${sensor.type}</p>
                            <p><strong>Valor:</strong> ${sensor.value} ${sensor.unit}</p>
                        </div>
                        <time datetime="${sensor.updated_at}">
                            Última actualización: ${new Date(sensor.updated_at).toLocaleString()}
                        </time>
                    </div>
                    <footer class="card-footer">
                        <a href="#" class="card-footer-item update-button" data-id="${sensor.id}">Actualizar</a>
                    </footer>
                </div>
            `;
            container.appendChild(sensorCard);
        });

        const updateButtons = document.querySelectorAll('.update-button');
        updateButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const sensorId = parseInt(button.getAttribute('data-id'));
                this.updateSensor(sensorId);
            });
        });
    }
}

const monitor = new SensorManager();

monitor.loadSensors('sensors.json');
