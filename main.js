function formatearMonto(num) {
  return Number(num).toLocaleString("es-AR");
}
let diaSeleccionado = null;
const coloresCategoria = {
  "Comida": "#ff4d4f",
  "Transporte": "#40a9ff",
  "Supermercado": "#73d13d",
  "Entretenimiento": "#9254de",
  "Alquiler": "#8c8c8c",
  "Servicios": "#36cfc9",
  "Tarjeta": "#597ef7",
  "Ropa": "#ff85c0",
  "Gimnasio": "#13c2c2",
  "Salud": "#2f54eb",
  "Salidas": "#fadb14",
};

let grafico;
let mostrarTodo = false;
let mesSeleccionado = new Date();
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

function obtenerGastosDelMes() {
  return gastos.filter(g => {
    const [y, m, d] = g.fecha.split("-");
    const f = new Date(y, m - 1, d);

    return (
      f.getMonth() === mesSeleccionado.getMonth() &&
      f.getFullYear() === mesSeleccionado.getFullYear()
    );
  });
}
function obtenerTotalMes(fechaBase) {
  return gastos.filter(g => {
    const [y, m, d] = g.fecha.split("-");
    const f = new Date(y, m - 1, d);

    return (
      f.getMonth() === fechaBase.getMonth() &&
      f.getFullYear() === fechaBase.getFullYear()
    );
  }).reduce((acc, g) => acc + g.monto, 0);
}
gastos = gastos.map(g => {
  if (g.fecha) return g;

  const hoy = new Date();

  const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  return { ...g, fecha: fechaLocal };
});

function guardar() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

window.onload = () => {
  const inputFecha = document.getElementById("fecha");
  if (inputFecha) inputFecha.valueAsDate = new Date();

  mostrarGastos();
};

function agregarGasto() {
  const btn = document.querySelector(".form button");

const descripcion = capitalizar(
  document.getElementById("descripcion").value.trim()
);
 const monto = Number(
  document.getElementById("monto").value.replace(/\D/g, "")
);
  const fecha = document.getElementById("fecha").value;
  const categoria = document.getElementById("categoria").value;

  // 👇 VALIDAR PRIMERO
  if (!descripcion || !monto || !fecha) {
 mostrarToast("⚠️ Completá todos los campos", "error");
    return;
  }

  // 👇 RECIÉN ACÁ loading
  btn.textContent = "Agregando...";
  btn.disabled = true;

  setTimeout(() => {
    try {
      gastos.push({
        descripcion,
        monto: Number(monto),
        fecha,
        categoria
      });

      guardar();
      mostrarGastos();
      generarCalendario();

      mostrarToast("✔ Gasto agregado");

      // limpiar inputs
      document.getElementById("descripcion").value = "";
      document.getElementById("monto").value = "";
    } catch (error) {
      console.error(error);
    }

    // 👇 SIEMPRE se ejecuta
    btn.textContent = "Agregar gasto";
    btn.disabled = false;

  }, 300);
}

function eliminarGasto(index) {
  gastos.splice(index, 1);
  guardar();
  mostrarGastos();
}

function mostrarGastos() {
  const lista = document.getElementById("lista");
  const totalEl = document.getElementById("total");

  const gastosMes = obtenerGastosDelMes(); // 👈 PRIMERO SIEMPRE

  const estadoVacio = document.getElementById("estadoVacio");
const dashboard = document.querySelector(".dashboard");

if (gastosMes.length === 0) {
  if (estadoVacio) estadoVacio.style.display = "block";
  if (dashboard) dashboard.style.display = "none";
} else {
  if (estadoVacio) estadoVacio.style.display = "none";
  if (dashboard) dashboard.style.display = "grid";
}

  lista.innerHTML = "";


  let total = 0;
  let categorias = {};
  let gastosPorFecha = {};
  const hoy = new Date();

  gastosMes.forEach((g) => {
  const indexReal = gastos.indexOf(g);

    total += g.monto;

    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.monto;

    if (!gastosPorFecha[g.fecha]) gastosPorFecha[g.fecha] = [];

  gastosPorFecha[g.fecha].push({ ...g, index: indexReal });
  });

const gastosOrdenados = [...gastosMes]
  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

const gastosAMostrar = mostrarTodo
  ? gastosOrdenados
  : gastosOrdenados.slice(0, 5);

// agrupar los que se van a mostrar
const gastosFiltradosPorFecha = {};

gastosAMostrar.forEach((g) => {
  if (!gastosFiltradosPorFecha[g.fecha]) {
    gastosFiltradosPorFecha[g.fecha] = [];
  }

  const indexReal = gastos.findIndex(x =>
    x.descripcion === g.descripcion &&
    x.monto === g.monto &&
    x.fecha === g.fecha
  );

  gastosFiltradosPorFecha[g.fecha].push({ ...g, index: indexReal });
});

// renderizar
Object.keys(gastosFiltradosPorFecha)
  .sort()
  .reverse()
  .forEach(fecha => {

    const totalDia = gastosFiltradosPorFecha[fecha]
      .reduce((acc, g) => acc + g.monto, 0);

    lista.innerHTML += `
      <h3 class="fecha-dia">${fecha} — $${formatearMonto(totalDia)}</h3>
    `;

    gastosFiltradosPorFecha[fecha].forEach(g => {
      lista.innerHTML += `
        <div class="gasto animado">
          
          <div class="gasto-left">
            <div class="color-dot" style="background:${coloresCategoria[g.categoria]}"></div>
            
            <div>
              <p class="desc">${g.descripcion}</p>
              <span class="meta">${g.categoria}</span>
            </div>
          </div>

          <div class="gasto-right">
            <span class="monto">$${formatearMonto(g.monto)}</span>
            <button onclick="eliminarConAnimacion(this, ${g.index})">✕</button>
          </div>

        </div>
      `;
    });
});

  if (gastosMes.length > 0) {
    lista.innerHTML += `
      <button class="btn-mostrar" onclick="toggleMostrar()">
        ${mostrarTodo ? "Mostrar menos ↑" : "Mostrar más ↓"}
      </button>
    `;
  }

 animarNumero(totalEl, total, 1000);

totalEl.classList.add("animando");
setTimeout(() => totalEl.classList.remove("animando"), 200);

  const totalGrafico = document.getElementById("graficoTotal");
  if (totalGrafico) {
  totalGrafico.style.display = gastosMes.length === 0 ? "none" : "block";
}

if (totalGrafico) {
animarNumero(totalGrafico, total);
}
  const totalActual = obtenerTotalMes(mesSeleccionado);
  const mesTexto = document.getElementById("mesActualTexto");
  const tituloMes = document.getElementById("tituloMes");

if (tituloMes) {
let nombreMes = mesSeleccionado.toLocaleDateString("es-AR", {
  month: "long"
});

nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  tituloMes.textContent = "Gastos de " + nombreMes;
  tituloMes.classList.remove("titulo-animado");
  void tituloMes.offsetWidth; // reinicia animación
  tituloMes.classList.add("titulo-animado");
}
if (mesTexto) {
  mesTexto.textContent = mesSeleccionado.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });
}

const mesAnterior = new Date(mesSeleccionado);
mesAnterior.setMonth(mesAnterior.getMonth() - 1);

const totalAnterior = obtenerTotalMes(mesAnterior);

let porcentaje = 0;

if (totalAnterior > 0) {
  porcentaje = ((totalActual - totalAnterior) / totalAnterior) * 100;
}
const compBox = document.getElementById("comparacion-box");

if (compBox) {
  compBox.innerHTML = `
    <div class="total-card">
      <p>Comparación mensual</p>
      <h2>
        ${porcentaje >= 0 ? "📈" : "📉"} ${porcentaje.toFixed(1)}%
      </h2>
      <span>Mes anterior: $${formatearMonto(totalAnterior)}</span>
    </div>
  `;
}

  const ctx = document.getElementById("grafico");
  if (!ctx) return;

  const datosOrdenados = Object.keys(categorias).map(cat => ({
  label: cat,
  value: categorias[cat]
})).sort((a, b) => b.value - a.value);

const labels = datosOrdenados.map(d => d.label);
const data = datosOrdenados.map(d => d.value);

  if (labels.length === 0) {
    if (grafico) {
      grafico.destroy();
      grafico = null;
    }
  } else {
if (grafico) {
  grafico.data.labels = labels;
  grafico.data.datasets[0].data = data;
   grafico.data.datasets[0].backgroundColor =
    labels.map(c => coloresCategoria[c] || "#ccc");
  grafico.update();
} else {
  grafico = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
datasets: [{
  data: data,
  backgroundColor: labels.map(c => coloresCategoria[c]),
  borderWidth: 0,
hoverOffset: 30,
hoverBorderWidth: 2,
hoverBorderColor: "#fff"
}]
      },
   options: {
  interaction: {
    mode: 'nearest',
    intersect: true
  },

  cutout: "65%",
  radius:"85%",

  layout: {
    padding: 10
  },
  

plugins: {  
  legend: {
    display: false
  },
tooltip: {
  backgroundColor: "#111",
  titleColor: "#fff",
  bodyColor: "#fff",
  padding: 10,
  cornerRadius: 8,
  callbacks: {
    label: function(context) {
      const value = context.raw || 0;

      const dataArr = context.chart.data.datasets[0].data;
      const total = dataArr.reduce((a, b) => a + b, 0);

      const porcentaje = total > 0
        ? ((value / total) * 100).toFixed(1)
        : 0;

      return context.label + ": $" + formatearMonto(value) + " (" + porcentaje + "%)";
    }
  }
}
}
  },

animation: {
  duration: 800,
  easing: "easeOutCubic"
}
});  
}

    function centrarTexto() {
  const canvasRect = ctx.getBoundingClientRect();
  const contenedor = document.querySelector(".grafico-container");
  const texto = document.getElementById("graficoTotal");

  if (!texto || !contenedor) return;

  const contRect = contenedor.getBoundingClientRect();

  const top = canvasRect.top - contRect.top + canvasRect.height / 2;
  const left = canvasRect.left - contRect.left + canvasRect.width / 2;

  texto.style.top = top + "px";
  texto.style.left = left + "px";
  texto.style.transform = "translate(-50%, -50%)";
}

// 👇 ejecutar cuando se crea
centrarTexto();

// 👇 ejecutar al redimensionar
window.addEventListener("resize", centrarTexto);
let ultimoIndex = null;

ctx.addEventListener("mousemove", (e) => {
  if (!grafico) return;

  const points = grafico.getElementsAtEventForMode(
    e,
    'nearest',
    { intersect: true },
    true
  );

  const totalGrafico = document.getElementById("graficoTotal");
  if (!totalGrafico) return;

  if (points.length > 0) {
    const index = points[0].index;

    if (index !== ultimoIndex) {
      const value = grafico.data.datasets[0].data[index];
      animarNumero(totalGrafico, value, 400);
      ultimoIndex = index;
    }

  } else {
    if (ultimoIndex !== null) {
      const total = grafico.data.datasets[0].data
        .reduce((a, b) => a + b, 0);

      animarNumero(totalGrafico, total, 600);
      ultimoIndex = null;
    }
  }
});
  }
const leyenda = document.getElementById("leyenda");

if (leyenda) {
  const totalLeyenda = data.reduce((a, b) => a + b, 0);

  leyenda.innerHTML = labels.map((cat, i) => {
    const max = Math.max(...data);
    const valor = data[i];
    const porcentaje = totalLeyenda > 0
      ? ((valor / totalLeyenda) * 100)
      : 0;

return `
  <div style="
    margin-bottom:10px;
    font-size:13px;
    ${valor === max ? "transform: scale(1.03); font-weight:600;" : ""}
  ">

    <div style="
      display:flex;
      justify-content:space-between;
      margin-bottom:4px;
    ">
      <span>
        ${valor === max ? "🔥 " : ""}${cat}
      </span>

      <span>
        $${formatearMonto(valor)} (${porcentaje.toFixed(1)}%)
      </span>
    </div>

    <div style="
      width:100%;
      height:6px;
      background:#e5e7eb;
      border-radius:4px;
      overflow:hidden;
    ">
      <div style="
        width:${porcentaje}%;
        height:100%;
        background:${coloresCategoria[cat]};
      "></div>
    </div>

  </div>
`;
  }).join("");
}
  generarCalendario(); // 👈 ESTO ES CLAVE
}
function generarCalendario() {
  const cont = document.getElementById("calendario");
  const mesEl = document.getElementById("mesSeleccionado");

  if (!cont || !mesEl) return;

  cont.innerHTML = "";

  const año = mesSeleccionado.getFullYear();
  const mes = mesSeleccionado.getMonth();

  const fechaActual = new Date(año, mes);

  mesEl.textContent = fechaActual.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });

 let primerDia = (new Date(año, mes, 1).getDay() + 6) % 7;
  const diasMes = new Date(año, mes + 1, 0).getDate();


  for (let i = 0; i < primerDia; i++) {
  const div = document.createElement("div");
  div.className = "dia vacio";
  cont.appendChild(div);
}

for (let i = 1; i <= diasMes; i++) {
  const fecha = `${año}-${String(mes + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

const gastosDia = gastos.filter(g => {
  const [year, month, day] = g.fecha.split("-");
  const f = new Date(year, month - 1, day);

  return (
    f.getDate() === i &&
    f.getMonth() === mes &&
    f.getFullYear() === año
  );
});

  const div = document.createElement("div");
div.className = "dia";

// 👇 detectar si es hoy
const hoy = new Date();

if (
  i === hoy.getDate() &&
  mes === hoy.getMonth() &&
  año === hoy.getFullYear()
) {
  div.classList.add("hoy");
  div.classList.add("activo");
  diaSeleccionado = div;

  verDetalle(fecha);
}

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

 verDetalle(fecha);
});

  cont.appendChild(div); // 👈 ESTO FALTABA
}
  }

function toggleMostrar() {
  const lista = document.getElementById("lista");

  // animación salida
  lista.classList.add("lista-oculta");

  setTimeout(() => {
    mostrarTodo = !mostrarTodo;

    mostrarGastos();

    // animación entrada
    lista.classList.remove("lista-oculta");
  }, 200);
}

function cambiarMes(valor) {
  mesSeleccionado.setMonth(mesSeleccionado.getMonth() + valor);
 mostrarGastos();
}
function verDetalle(fecha) {
  const detalle = document.querySelector("#modalCalendario #detalle-dia");

  const [year, month, day] = fecha.split("-");
  const fechaObj = new Date(year, month - 1, day);

  const gastosDia = gastos.filter(g => {
    const [y, m, d] = g.fecha.split("-");
    const f = new Date(y, m - 1, d);

    return (
      f.getFullYear() === fechaObj.getFullYear() &&
      f.getMonth() === fechaObj.getMonth() &&
      f.getDate() === fechaObj.getDate()
    );
  });

  const totalDia = gastosDia.reduce((acc, g) => acc + g.monto, 0);
    if (gastosDia.length === 0) {
    detalle.classList.remove("activo");
    detalle.classList.add("vacio");

    detalle.innerHTML = `
      <div style="text-align: center; opacity: 0.6;padding:10px;">
        <div style="font-size:20px;">🧾</div>
        <div>No tenés gastos este día</div>
      </div>
    `;
    return;
  }
  detalle.classList.remove("vacio");
  detalle.classList.add("activo");

 detalle.innerHTML = `
  <div style="margin-bottom:10px;">
    <strong>${fechaObj.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long"
    })}</strong>
  </div>

  <div style="margin-bottom:10px; font-weight:600;">
    Total: $${formatearMonto(totalDia)}
  </div>

  ${gastosDia.map(g => `
    <div class="detalle-item">
      <span class="desc">${g.descripcion}</span>
      <strong>$${formatearMonto(g.monto)}</strong>
    </div>
  `).join("")}
`;
}
function animarNumero(elemento, valorFinal, duracion = 800) {
  const start = 0;
  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function actualizar(tiempoActual) {
    const progreso = Math.min((tiempoActual - startTime) / duracion, 1);
    const eased = easeOutCubic(progreso);

    const valorActual = Math.floor(start + (valorFinal - start) * eased);

    elemento.textContent = "$" + formatearMonto(valorActual);

    if (progreso < 1) {
      requestAnimationFrame(actualizar);
    }
  }

  requestAnimationFrame(actualizar);
}
function eliminarConAnimacion(btn, index) {
  const card = btn.closest(".gasto");

  card.style.transition = "0.3s";
  card.style.opacity = "0";
  card.style.transform = "translateX(20px)";

  setTimeout(() => {
    eliminarGasto(index);
  }, 300);
}
function abrirCalendario() {
  document.getElementById("modalCalendario").classList.add("activo");
}

function cerrarCalendario() {
  const modal = document.getElementById("modalCalendario");
  const contenido = modal.querySelector(".modal-contenido");

  // animación de salida
  contenido.style.transform = "scale(0.9)";
  contenido.style.opacity = "0";

  setTimeout(() => {
    modal.classList.remove("activo");

    // reset para próxima apertura
    contenido.style.transform = "";
    contenido.style.opacity = "";
  }, 250); // mismo tiempo que el CSS
}
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("modalCalendario");

  if (e.key === "Escape" && modal.classList.contains("activo")) {
    cerrarCalendario();
  }
});

// cerrar haciendo click afuera
const modalCal = document.getElementById("modalCalendario");

if (modalCal) {
  modalCal.addEventListener("click", (e) => {
    if (e.target.id === "modalCalendario") {
      cerrarCalendario();
    }
  });
}
function mostrarToast(mensaje, tipo = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = mensaje;

  // reset clases
  toast.classList.remove("success", "error");

  // aplicar tipo
  toast.classList.add(tipo);

  // mostrar
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}
const inputMonto = document.getElementById("monto");

inputMonto.addEventListener("input", (e) => {
  let valor = e.target.value;

  // eliminar todo lo que no sea número
  valor = valor.replace(/\D/g, "");

  // convertir a número
  let numero = Number(valor);

  if (!numero) {
    e.target.value = "";
    return;
  }

  // formatear con puntos
  e.target.value = "$" + numero.toLocaleString("es-AR");
});