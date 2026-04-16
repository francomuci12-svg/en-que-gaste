function formatearMonto(num) {
  return num.toLocaleString("es-AR");
}
let diaSeleccionado = null;
const coloresCategoria = {
  "Comida": "#e53935",
  "Transporte": "#1e88e5",
  "Supermercado": "#43a047",
  "Entretenimiento": "#fb8c00",
  "Alquiler": "#757575",
  "Servicios": "#00acc1",
  "Tarjeta": "#8e24aa",
  "Deudas": "#d32f2f",
  "Ahorro": "#2e7d32",
  "Ropa": "#d81b60",
  "Gimnasio": "#00897b",
  "Salud": "#1976d2",
  "Salidas": "#f57c00",
  "Mascotas": "#7cb342"
};

let grafico;
let mostrarTodo = false;
let mesActual = new Date();

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

gastos = gastos.map(g => ({
  ...g,
  fecha: g.fecha || new Date().toISOString().split("T")[0]
}));

function guardar() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

window.onload = () => {
  const inputFecha = document.getElementById("fecha");
  if (inputFecha) inputFecha.valueAsDate = new Date();

  mostrarGastos();
};

function agregarGasto() {
  let descripcion = document.getElementById("descripcion").value.trim();

  descripcion = descripcion
    .toLowerCase()
    .split(/\s+/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

  const monto = Number(document.getElementById("monto").value);
  const categoria = document.getElementById("categoria").value;
  const fecha = document.getElementById("fecha").value;

  if (!descripcion || !monto) return;

  gastos.push({ descripcion, monto, categoria, fecha });

  document.getElementById("descripcion").value = "";
  document.getElementById("monto").value = "";

  guardar();
  mostrarGastos();
}

function eliminarGasto(index) {
  gastos.splice(index, 1);
  guardar();
  mostrarGastos();
}

function mostrarGastos() {
  const lista = document.getElementById("lista");
  const totalEl = document.getElementById("total");

  lista.innerHTML = "";

  let total = 0;
  let categorias = {};
  let gastosPorFecha = {};

  const hoy = new Date();

  const ultimosDias = [0, 1, 2].map(d => {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() - d);
    return fecha.toISOString().split("T")[0];
  });

  gastos.forEach((g, index) => {
    total += g.monto;

    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.monto;

    if (!gastosPorFecha[g.fecha]) gastosPorFecha[g.fecha] = [];

    gastosPorFecha[g.fecha].push({ ...g, index });
  });

  Object.keys(gastosPorFecha)
    .filter(f => mostrarTodo || ultimosDias.includes(f))
    .sort()
    .reverse()
    .forEach(fecha => {

      const totalDia = gastosPorFecha[fecha]
        .reduce((acc, g) => acc + g.monto, 0);

      lista.innerHTML += `
        <h3>${fecha} — $${formatearMonto(totalDia)}</h3>
      `;

      gastosPorFecha[fecha].forEach(g => {
        lista.innerHTML += `
          <div class="gasto ${g.categoria.toLowerCase().replace(/\s+/g, "")}">
            ${g.descripcion} - $${formatearMonto(g.monto)}
            <button onclick="eliminarGasto(${g.index})">×</button>
          </div>
        `;
      });
    });

  lista.innerHTML += `
    <button onclick="toggleMostrar()">
      ${mostrarTodo ? "Mostrar menos" : "Mostrar más"}
    </button>
  `;

  totalEl.textContent = formatearMonto(total);

  const ctx = document.getElementById("grafico");

  if (ctx) {
    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(categorias),
        datasets: [{
          data: Object.values(categorias),
          backgroundColor: Object.keys(categorias).map(c => coloresCategoria[c])
        }]
      }
    });
  }

  generarCalendario();
}

function generarCalendario() {
  const cont = document.getElementById("calendario");
  const mesEl = document.getElementById("mesActual");

  if (!cont || !mesEl) return;

  cont.innerHTML = "";

  const año = mesActual.getFullYear();
  const mes = mesActual.getMonth();

  const fechaActual = new Date(año, mes);

  mesEl.textContent = fechaActual.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });

  const primerDia = new Date(año, mes, 1).getDay();
  const diasMes = new Date(año, mes + 1, 0).getDate();

  const offset = primerDia === 0 ? 6 : primerDia - 1;

  for (let i = 0; i < offset; i++) {
    cont.innerHTML += `<div class="dia vacio"></div>`;
  }

for (let i = 1; i <= diasMes; i++) {
  const fecha = `${año}-${String(mes + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

  const gastosDia = gastos.filter(g => {
    const f = new Date(g.fecha).toISOString().split("T")[0];
    return f === fecha;
  });

  const div = document.createElement("div");
  div.className = "dia";

  div.innerHTML = `
    <div class="dia-header">
      <span class="numero-dia">${i}</span>
    </div>

    <div class="dia-body">
      ${
        gastosDia.length > 0
          ? `
            <div class="gasto-dia">
              <span class="monto">$${formatearMonto(gastosDia[0].monto)}</span>
              <span class="desc">${gastosDia[0].descripcion}</span>
            </div>

            ${
              gastosDia.length > 1
                ? `<div class="extra">+${gastosDia.length - 1} más</div>`
                : ""
            }
          `
          : ""
      }
    </div>
  `;

  div.addEventListener("click", (e) => {
  const rect = e.currentTarget.getBoundingClientRect();

  // sacar selección anterior
  if (diaSeleccionado) {
    diaSeleccionado.classList.remove("activo");
  }

  // marcar nuevo
  div.classList.add("activo");
  diaSeleccionado = div;

  verDetalle(fecha, rect);
});

  cont.appendChild(div); // 👈 ESTO FALTABA
}
  }

function toggleMostrar() {
  mostrarTodo = !mostrarTodo;
  mostrarGastos();
}

function cambiarMes(valor) {
  mesActual.setMonth(mesActual.getMonth() + valor);
  generarCalendario();
}
function verDetalle(fecha,rect) {
  const overlay = document.getElementById("overlay");
  const modal = document.getElementById("modal");

  const gastosDia = gastos.filter(g => {
    const f = new Date(g.fecha).toISOString().split("T")[0];
    return f === fecha;
  });

  const totalDia = gastosDia.reduce((acc, g) => acc + g.monto, 0);

// posición inicial (desde el día)
if (rect) {
  modal.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;
} else {
  modal.style.transformOrigin = "center";
}
  modal.innerHTML = `
    <div class="modal-header">
      <h3>${new Date(fecha).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long"
      })}</h3>

      <span class="total-dia">$${formatearMonto(totalDia)}</span>

      <button class="cerrar" onclick="cerrarModal()">×</button>
    </div>

    <div class="modal-body">
      ${
        gastosDia.length === 0
          ? "<p class='vacio'>No hay gastos</p>"
          : gastosDia.map(g => `
            <div class="detalle-item">
              <span class="desc">${g.descripcion}</span>
              <strong>$${formatearMonto(g.monto)}</strong>
            </div>
          `).join("")
      }
    </div>
  `;

  overlay.classList.add("active");
}
function cerrarModal() {
  document.getElementById("overlay").classList.remove("active");
}