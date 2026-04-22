const sonidoError = new Audio("https://assets.mixkit.co/active_storage/sfx/1117/1117-preview.mp3");
sonidoError.volume = 0.3;
const sonidoAgregar = new Audio("https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3");
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
const iconosCategoria = {
  "Comida": "🍔",
  "Transporte": "🚗",
  "Supermercado": "🛒",
  "Entretenimiento": "🎮",
  "Alquiler": "🏠",
  "Servicios": "💡",
  "Tarjeta": "💳",
  "Ropa": "👕",
  "Gimnasio": "🏋️",
  "Salud": "💊",
  "Salidas": "🍻"
};
let historialObjetivos = JSON.parse(localStorage.getItem("historialObjetivos")) || [];
let objetivosCompletados = JSON.parse(localStorage.getItem("objetivosCompletados")) || [];
let montoPendiente = 0;
let accionPendiente = null;
let confirmarRetiro = false;
let objetivos = [];
let objetivoActivo = null;
let grafico;
let mesSeleccionado = new Date();
let porcentajeAnterior = 0;
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
objetivos = JSON.parse(localStorage.getItem("objetivos")) || [];
objetivoActivo = JSON.parse(localStorage.getItem("objetivoActivo"));
objetivoActivo = Number(objetivoActivo);

if (isNaN(objetivoActivo)) {
  objetivoActivo = objetivos.length > 0 ? 0 : null;
}

renderObjetivo();
renderListaObjetivos();
renderSelectorObjetivo();

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
    if (g.categoria === "Ahorro") return false; // 👈 CLAVE

    const [y, m, d] = g.fecha.split("-");
    const f = new Date(y, m - 1, d);

    return (
      f.getMonth() === fechaBase.getMonth() &&
      f.getFullYear() === fechaBase.getFullYear()
    );
  }).reduce((acc, g) => acc + g.monto, 0);
}

function guardar() {
  localStorage.setItem("objetivos", JSON.stringify(objetivos));
localStorage.setItem("objetivoActivo", objetivoActivo);
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

function agregarGasto() {

  const btn = document.querySelector(".form button");

  let descripcion = document.getElementById("descripcion").value.trim();

  // 👉 capitalizar SIEMPRE
  descripcion = descripcion.charAt(0).toUpperCase() + descripcion.slice(1).toLowerCase();

  const monto = Number(
    document.getElementById("monto").value.replace(/\D/g, "")
  );

  const fecha = document.getElementById("fecha").value;
  const categoria = document.getElementById("categoria").value;


  // 👇 VALIDACIÓN
  if (!descripcion || !monto || !fecha) {
    mostrarToast("⚠️ Completá todos los campos", "error");

    sonidoError.currentTime = 0;
    sonidoError.play().catch(() => {});
    return;
  }

  // 👇 LOADING
  btn.textContent = "Agregando...";
  btn.disabled = true;

  setTimeout(() => {
    try {
      gastos.push({
        descripcion,
        monto,
        fecha,
        categoria
      });

      sonidoAgregar.currentTime = 0;
      sonidoAgregar.play().catch(() => {});

      guardar();
      mostrarGastos();
      generarCalendario();

      mostrarToast("✔ Gasto agregado");

      // 🔥 animación gráfico
      const graficoEl = document.getElementById("grafico");

      if (graficoEl) {
        graficoEl.style.transition = "transform 0.25s ease";
        graficoEl.style.transform = "scale(1.08)";

        setTimeout(() => {
          graficoEl.style.transform = "scale(1)";
        }, 250);
      }

      // limpiar inputs
      document.getElementById("descripcion").value = "";
      document.getElementById("monto").value = "";

    } catch (error) {
      console.error(error);
    }

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
  const totalEl = document.getElementById("total");
  const contCategorias = document.getElementById("categorias");
  const estadoVacio = document.getElementById("estadoVacio");
  const dashboard = document.querySelector(".dashboard");

  const gastosMes = obtenerGastosDelMes();
  const gastosFiltrados = gastosMes.filter(g => g.categoria !== "Ahorro");

  // 👇 estado vacío
  if (gastosFiltrados.length === 0) {
    if (estadoVacio) estadoVacio.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
  } else {
    if (estadoVacio) estadoVacio.style.display = "none";
    if (dashboard) dashboard.style.display = "grid";
  }

  let total = 0;
  let categorias = {};

  gastosFiltrados.forEach(g => {
    total += g.monto;
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.monto;
  });

  // 👇 TOTAL
  if (totalEl) animarNumero(totalEl, total);
  // 👇 GASTO HOY
const hoy = new Date();

const totalHoy = gastosFiltrados
  .filter(g => {
    const [y, m, d] = g.fecha.split("-");
    const f = new Date(y, m - 1, d);

    return (
      f.getDate() === hoy.getDate() &&
      f.getMonth() === hoy.getMonth() &&
      f.getFullYear() === hoy.getFullYear()
    );
  })
  .reduce((acc, g) => acc + g.monto, 0);

const totalHoyEl = document.getElementById("totalHoy");

if (totalHoyEl) {
  animarNumero(totalHoyEl, totalHoy);
}

  // 👇 COMPARACIÓN MENSUAL
  const mesAnterior = new Date(mesSeleccionado);
  mesAnterior.setMonth(mesAnterior.getMonth() - 1);

  const totalAnterior = obtenerTotalMes(mesAnterior);

  let porcentaje = 0;
  if (totalAnterior > 0) {
    porcentaje = ((total - totalAnterior) / totalAnterior) * 100;
  }

  const compBox = document.getElementById("comparacion-box");
  if (compBox) {
    compBox.innerHTML = `
      <div class="total-card">
        <p>Comparación mensual</p>
        <h2>${porcentaje >= 0 ? "📈" : "📉"} ${porcentaje.toFixed(1)}%</h2>
        <span>Mes anterior: $${formatearMonto(totalAnterior)}</span>
      </div>
    `;
  }

  // 👇 TEXTO MES
  const mesTexto = document.getElementById("mesActualTexto");
  const tituloMes = document.getElementById("tituloMes");

  if (tituloMes) {
    let nombreMes = mesSeleccionado.toLocaleDateString("es-AR", { month: "long" });
    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    tituloMes.textContent = "Gastos de " + nombreMes;
  }

  if (mesTexto) {
    mesTexto.textContent = mesSeleccionado.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric"
    });
  }

  // 👇 ICONOS
  const iconosCategoria = {
    "Comida": "🍔",
    "Transporte": "🚗",
    "Supermercado": "🛒",
    "Entretenimiento": "🎮",
    "Alquiler": "🏠",
    "Servicios": "💡",
    "Tarjeta": "💳",
    "Ropa": "👕",
    "Gimnasio": "🏋️",
    "Salud": "💊",
    "Salidas": "🍻"
  };

  // 👇 CATEGORÍAS UI PRO
if (contCategorias) {

  const totalCategorias = Object.values(categorias)
    .reduce((a, b) => a + b, 0);

  const categoriasOrdenadas = Object.keys(categorias)
  .map(cat => ({
    nombre: cat,
    valor: categorias[cat],
    porcentaje: totalCategorias > 0
      ? (categorias[cat] / totalCategorias) * 100
      : 0
  }))
  .sort((a, b) => b.valor - a.valor);

// 👇 limitar a 7 + "Otros"
let lista = categoriasOrdenadas;

categoriasOcultas = []; // reset

if (categoriasOrdenadas.length > 7) {
  const top = categoriasOrdenadas.slice(0, 7);
  const resto = categoriasOrdenadas.slice(7);

  categoriasOcultas = resto.map(c => c.nombre);

  const totalOtros = resto.reduce((acc, cat) => acc + cat.valor, 0);

  top.push({
    nombre: "Otros",
    valor: totalOtros,
    porcentaje: totalCategorias > 0
      ? (totalOtros / totalCategorias) * 100
      : 0
  });

  lista = top;
}

const max = lista.length
  ? Math.max(...lista.map(c => c.valor))
  : 0;

contCategorias.innerHTML = lista.length === 0
  ? "<p style='opacity:0.6'>Sin datos</p>"
  : lista.map(cat => `
    <div class="categoria-item ${cat.valor === max ? 'cat-top-max' : ''}"
         data-cat="${cat.nombre}" 
         onclick="verCategoria('${cat.nombre}')">

      <div class="cat-top">
        <div class="cat-left">
          <span>${iconosCategoria[cat.nombre] || "💰"}</span>
          <span class="cat-nombre">${cat.nombre}</span>
        </div>

        <span class="cat-monto">$${formatearMonto(cat.valor)}</span>
      </div>

      <div class="cat-barra">
        <div class="cat-fill" 
             style="width:${cat.porcentaje}%; background:${coloresCategoria[cat.nombre] || "#ccc"}">
        </div>
      </div>

      <div class="cat-porcentaje">
        ${cat.porcentaje.toFixed(0)}%
      </div>

    </div>
  `).join("");

document.querySelectorAll(".categoria-item").forEach(item => {
  item.addEventListener("mouseenter", () => {
    const cat = item.dataset.cat;
    const index = grafico.data.labels.indexOf(cat);
if (index === -1) return; // 👈 clave
    grafico.setActiveElements([{ datasetIndex: 0, index }]);
    grafico.update();
  });

  item.addEventListener("mouseleave", () => {
    grafico.setActiveElements([]);
    grafico.update();
  });
});
  }

  // 👇 GRÁFICO
  const ctx = document.getElementById("grafico");
  if (!ctx) return;

  const labels = Object.keys(categorias);
  const data = Object.values(categorias);

  const totalGrafico = document.getElementById("graficoTotal");

  if (grafico) {
    grafico.data.labels = labels;
    grafico.data.datasets[0].data = data;
    grafico.data.datasets[0].backgroundColor =
      labels.map(c => coloresCategoria[c] || "#ccc");

    grafico.update({
      duration: 800,
      easing: "easeOutCubic"
    });

  } else {
    grafico = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          hoverOffset: 45,
          backgroundColor: labels.map(c => coloresCategoria[c] || "#ccc"),
          borderWidth: 2,
          borderColor: "#fff",
          hoverBorderWidth: 3,
          hoverBorderColor: "#fff",
        }]
      },
      options: {
        cutout: "70%",
        radius: "80%",
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1200,
          easing: "easeOutCubic",
          delay: (ctx) => ctx.dataIndex * 150
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // animación entrada
    ctx.classList.remove("activo");
    setTimeout(() => ctx.classList.add("activo"), 50);

    if (totalGrafico) {
      totalGrafico.style.display = "block";
      animarNumero(totalGrafico, total);
    }
  }

  // 👇 HOVER PRO
  ctx.onmousemove = null;

  let ultimoIndex = null;

  ctx.addEventListener("mousemove", (e) => {
    if (!grafico) return;

    const points = grafico.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);

    if (!totalGrafico) return;

    if (points.length > 0) {
      const index = points[0].index;

      grafico.setActiveElements([{ datasetIndex: 0, index }]);

      grafico.data.datasets[0].backgroundColor =
        grafico.data.labels.map((cat, i) =>
          i === index ? coloresCategoria[cat] : coloresCategoria[cat] + "55"
        );

      if (index !== ultimoIndex) {
        animarNumero(totalGrafico, grafico.data.datasets[0].data[index], 300);
        ultimoIndex = index;
      }

      grafico.update("none");

    } else {
  // 👇 SOLO si antes estabas en una categoría
  if (ultimoIndex !== null) {

    grafico.setActiveElements([]);

    grafico.data.datasets[0].backgroundColor =
      grafico.data.labels.map(cat => coloresCategoria[cat]);

    const total = grafico.data.datasets[0].data.reduce((a, b) => a + b, 0);
    animarNumero(totalGrafico, total, 400);

    ultimoIndex = null;

    grafico.update("none");
  }
}
  });

  generarCalendario();
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

  let haySeleccion = false; // 👈 clave

  for (let i = 1; i <= diasMes; i++) {
    const fecha = `${año}-${String(mes + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

    const gastosDia = gastos.filter(g => {
      if (g.categoria === "Ahorro") return false;

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

    // 👇 HOY (solo si es el mes actual)
    const hoy = new Date();

    if (
      i === hoy.getDate() &&
      mes === hoy.getMonth() &&
      año === hoy.getFullYear()
    ) {
      div.classList.add("hoy");
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

    div.addEventListener("click", () => {
      if (diaSeleccionado) {
        diaSeleccionado.classList.remove("activo");
      }

      div.classList.add("activo");
      diaSeleccionado = div;

      verDetalle(fecha);
    });

    cont.appendChild(div);
  }

  // 🔥 AUTO SELECCIÓN (LO NUEVO)
  const dias = cont.querySelectorAll(".dia:not(.vacio)");

  let diaConGasto = null;

  for (let i = 0; i < dias.length; i++) {
    if (dias[i].querySelector(".gasto-dia")) {
      diaConGasto = dias[i];
      break;
    }
  }

  // limpiar selección anterior
  if (diaSeleccionado) {
    diaSeleccionado.classList.remove("activo");
  }

  const nuevoDia = diaConGasto || dias[0];

  if (nuevoDia) {
    nuevoDia.classList.add("activo");
    diaSeleccionado = nuevoDia;

    const numero = nuevoDia.querySelector(".numero-dia").textContent;

    const fecha = `${año}-${String(mes + 1).padStart(2, "0")}-${String(numero).padStart(2, "0")}`;

    verDetalle(fecha);
  }
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
     if (g.categoria === "Ahorro") return false; 
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
})

function actualizarAhorroUI() {
  const totalUI = document.getElementById("totalAhorroUI");
  if (!totalUI) return;

  const ahorroTotal = objetivos.reduce((acc, obj) => acc + obj.actual, 0);

  totalUI.textContent = "$" + formatearMonto(ahorroTotal);
}
function sumarAhorro() {
  const valor = Number(input.value.replace(/\D/g, ""));

  if (!valor) {
    mostrarToast("Ingresá un monto", "error");
    return;
  }

  const hoy = new Date().toISOString().split("T")[0];

  // 👉 1. actualizar objetivo
  if (objetivoActivo !== null) {
    objetivos[objetivoActivo].actual += valor;
  }

  // 👉 2. guardar en historial
  gastos.push({
    descripcion: "Ahorro",
    monto: valor,
    fecha: hoy,
    categoria: "Ahorro"
  });

  // 👉 3. guardar datos
  guardar();

  // 👉 4. actualizar UI
  renderObjetivo();
  actualizarAhorroUI();

const barra = document.querySelector(".obj-fill");

if (barra) {
  barra.classList.add("animar-barra");

  setTimeout(() => {
    barra.classList.remove("animar-barra");
  }, 600);
}
  // 👉 5. animación
  const card = document.querySelector(".ahorro-top");
  if (card) {
    card.style.transform = "scale(1.05)";
    setTimeout(() => {
      card.style.transform = "scale(1)";
    }, 200);
  }

  // 👉 6. limpiar input
  input.value = "";
}
function restarAhorro() {
  const input = document.getElementById("inputAhorroUI");
  if (!input) return;

  let monto = Number(input.value.replace(/\D/g, ""));
  if (!monto) return;

  if (objetivoActivo === null || objetivos.length === 0) return;

  const obj = objetivos[objetivoActivo];
  const actual = Number(obj.actual) || 0;

  // 🚫 VALIDACIÓN (primer click)
  if (monto > actual) {
    mostrarToast(
      `❌ No tenés suficiente. Máximo: $${formatearMonto(actual)}`,
      "error"
    );

    confirmarRetiro = true; // 👈 activamos confirmación

    input.value = "$" + formatearMonto(actual);

    input.focus();
    setTimeout(() => {
      input.setSelectionRange(1, input.value.length);
    }, 0);

    return;
  }

  // ⚠️ SEGUNDO CLICK → confirmar
  if (confirmarRetiro) {
  confirmarRetiro = false;

  abrirConfirmacion(
    `¿Querés retirar $${formatearMonto(monto)} del objetivo?`,
    () => {
      ejecutarRetiro(monto);
    }
  );

  return;
}

  // ✅ RESTAR
  obj.actual = actual - monto;

  localStorage.setItem("objetivos", JSON.stringify(objetivos));

  renderObjetivo();
  renderListaObjetivos();

  mostrarToast("💸 Retiro realizado");

  input.value = "$";
}
function animarPorcentaje(elemento, valorFinal, duracion = 600) {
  const start = 0;
  const startTime = performance.now();

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function actualizar(tiempoActual) {
    const progreso = Math.min((tiempoActual - startTime) / duracion, 1);
    const eased = easeOut(progreso);

    const valorActual = Math.floor(start + (valorFinal - start) * eased);

    elemento.textContent = valorActual + "%";

    if (progreso < 1) {
      requestAnimationFrame(actualizar);
    }
  }

  requestAnimationFrame(actualizar);
}
function verCategoria(nombre) {

  const modal = document.getElementById("modalCategoria");
  if (!modal) return;

  const gastosMes = obtenerGastosDelMes();

  let filtrados;

  if (nombre === "Otros") {
    filtrados = gastosMes.filter(g =>
      categoriasOcultas.includes(g.categoria) && g.categoria !== "Ahorro"
    );
  } else {
    filtrados = gastosMes.filter(g =>
      g.categoria === nombre && g.categoria !== "Ahorro"
    );
  }

  modal.classList.add("activo");

  modal.innerHTML = `
    <div class="modal-cat-content">
      
      <div class="modal-cat-header">
        <h3>${nombre}</h3>
        <button onclick="cerrarCategoria()">✕</button>
      </div>

      <div class="modal-cat-body">
        ${
          filtrados.length === 0
            ? "<p style='opacity:0.6'>Sin gastos</p>"
            : filtrados.map(g => `
              <div class="detalle-item">
                <span>${g.descripcion}</span>
                <strong>$${formatearMonto(g.monto)}</strong>

                <button 
                  class="btn-eliminar"
                  onclick="eliminarDesdeCategoria('${g.fecha}', ${g.monto}, '${g.descripcion}')"
                >
                  ✕
                </button>
              </div>
            `).join("")
        }
      </div>

    </div>
  `;
}
function cerrarCategoria() {
  const modal = document.getElementById("modalCategoria");
  if (modal) modal.classList.remove("activo");
}
function eliminarDesdeCategoria(fecha, monto, descripcion) {
  const confirmar = confirm("¿Eliminar este gasto?");

  if (!confirmar) return;

  const index = gastos.findIndex(g =>
    g.fecha === fecha &&
    g.monto === monto &&
    g.descripcion === descripcion
  );

  if (index === -1) return;

  // 👇 buscar el elemento visual
  const items = document.querySelectorAll(".modal-cat-body .detalle-item");

  items.forEach(item => {
    if (item.innerText.includes(descripcion) && item.innerText.includes(formatearMonto(monto))) {

      // 💥 animación salida
      item.style.transition = "all 0.3s ease";
      item.style.opacity = "0";
      item.style.transform = "translateX(20px)";

      setTimeout(() => {
        gastos.splice(index, 1);
        guardar();
        mostrarGastos();
        generarCalendario();

        item.remove();
      }, 300);
    }
  });
}
function crearObjetivo(nombre, meta) {

  if (!nombre || !meta) return;

  nombre = capitalizar(nombre);

  objetivos.push({
    nombre: nombre,
    actual: 0,
    meta: Number(meta),
    completado: false
  });

  if (objetivoActivo === null || objetivoActivo === undefined) {
    objetivoActivo = 0;
  }

  renderObjetivo();
  renderListaObjetivos();

  actualizarEstadoAhorro(); // 👈 ACÁ (clave)

  console.log("Objetivos:", objetivos);
  console.log("Activo:", objetivoActivo);
}

function renderObjetivo() {

  const cont = document.getElementById("objetivoUI");
  if (!cont) return;

  if (objetivos.length === 0) {
    cont.innerHTML = `<p style="opacity:0.6">No hay objetivos</p>`;
    return;
  }

  if (objetivoActivo === null) {
    cont.innerHTML = `<p style="opacity:0.6">Seleccioná un objetivo</p>`;
    return;
  }

  const obj = objetivos[objetivoActivo];

  const porcentaje = obj.meta > 0
  ? (obj.actual / obj.meta) * 100
  : 0;

  const porcentajeVisual = Math.max(porcentaje, 2);
  const restante = obj.meta - obj.actual;

const textoExtra = restante <= 0
  ? "✔ Objetivo completado"
  : `Te faltan $${formatearMonto(restante)}`;

 cont.innerHTML = `
  <div class="objetivo-card">

    ${
      obj.actual >= obj.meta
        ? `<button class="btn-eliminar-obj" onclick="eliminarObjetivo(${objetivoActivo})">✕</button>`
        : ""
    }

    <div class="obj-top">
      <span>${obj.nombre}</span>
      <span>$${formatearMonto(obj.actual)} / $${formatearMonto(obj.meta)}</span>
    </div>

    <div class="obj-barra">
      <div class="obj-fill" id="barraObjetivo"></div>

      <span class="porcentaje-barra" style="left:${porcentajeVisual}%">
        ${porcentaje.toFixed(1)}%
      </span>
    </div>

    <div class="obj-extra">
      ${textoExtra}
    </div>

  </div>
`;
  animarBarra(porcentajeVisual);
  const card = cont.querySelector(".objetivo-card");

if (card && porcentaje >= 100) {
  card.classList.add("completado");
} else if (card) {
  card.classList.remove("completado");
}
}
function renderSelectorObjetivo() {

  const select = document.getElementById("selectorObjetivo");
  if (!select) return;

  if (objetivos.length === 0) {
    select.innerHTML = `<option>No hay objetivos</option>`;
    return;
  }

  select.innerHTML = objetivos.map((obj, i) => `
    <option value="${i}" ${i === objetivoActivo ? "selected" : ""}>
      ${obj.nombre}
    </option>
  `).join("");
}
document.addEventListener("change", (e) => {
  if (e.target.id === "selectorObjetivo") {
    objetivoActivo = Number(e.target.value);
    renderObjetivo();
  }
});
function crearObjetivoDesdeUI() {

  const nombreInput = document.getElementById("NuevoNombre");
  const metaInput = document.getElementById("NuevoMonto");

  const nombre = nombreInput.value.trim();
  const meta = Number(metaInput.value.replace(/\D/g, ""));

  if (!nombre || !meta) {
    mostrarToast("Completá nombre y monto", "error");
    return;
  }

  crearObjetivo(nombre, meta);

  // limpiar inputs
  nombreInput.value = "";
  metaInput.value = "";
}
function calcularTotalAhorros() {
  return objetivos.reduce((acc, obj) => acc + obj.actual, 0);
}
function abrirModalObjetivo() {
  const modal = document.getElementById("modalObjetivo");
  modal.classList.add("activo");

  const inputMonto = document.getElementById("nuevoMonto");
  const inputNombre = document.getElementById("nuevoNombre");

  // 💰 formato moneda
  formatearInputMoneda(inputMonto);

  // ✍️ evitar duplicar listener
  if (!inputNombre.dataset.listener) {
    inputNombre.addEventListener("input", (e) => {
      let valor = e.target.value;
      e.target.value = valor.charAt(0).toUpperCase() + valor.slice(1);
    });

    inputNombre.dataset.listener = "true";
  }
}

function cerrarModalObjetivo() {
  document.getElementById("modalObjetivo").classList.remove("activo");
}

function crearObjetivoDesdeModal() {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const monto = Number(document.getElementById("nuevoMonto").value.replace(/\D/g, ""));

  // ✅ VALIDACIÓN ÚNICA
  if (!nombre || !monto || monto <= 0) {
    mostrarToast("Completá bien los datos", "error");
    return;
  }

  crearObjetivo(nombre, monto);

  cerrarModalObjetivo();

  // limpiar inputs
  document.getElementById("nuevoNombre").value = "";
  document.getElementById("nuevoMonto").value = "";
}
function renderListaObjetivos() {
  const cont = document.getElementById("listaObjetivos");
  if (!cont) return;

  if (objetivos.length === 0) {
    cont.innerHTML = "";
    return;
  }

  cont.innerHTML = objetivos.map((obj, index) => {

    const actual = Number(obj.actual) || 0;
    const meta = Number(obj.meta) || 1;
    const porcentaje = Math.floor((actual / meta) * 100);

    return `
      <div class="objetivo-chip ${index === objetivoActivo ? "activo" : ""}"
           data-index="${index}">

        <div class="chip-nombre">${obj.nombre}</div>
        <div class="chip-porcentaje">${porcentaje}%</div>

      </div>
    `;
  }).join("");

  // 👇 eventos (correcto)
  document.querySelectorAll(".objetivo-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const index = Number(chip.dataset.index);
      seleccionarObjetivo(index);
    });
  });
}
function seleccionarObjetivo(index) {
  const card = document.getElementById("objetivoUI");

  if (card) {
    card.classList.add("cambiando");
  }

  setTimeout(() => {
    objetivoActivo = index;

    renderListaObjetivos();
    renderObjetivo();

    if (card) {
      card.classList.remove("cambiando");
    }
  }, 150);
}
function formatearInputMoneda(input) {
  if (!input) return;

  input.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");

    if (!valor) {
      e.target.value = "$";
      return;
    }

    let numero = Number(valor);
    e.target.value = "$" + numero.toLocaleString("es-AR");
      setTimeout(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  });

  input.addEventListener("focus", () => {
    if (input.value === "") {
      input.value = "$";
    }
  });

  input.addEventListener("blur", () => {
    if (input.value === "$") {
      input.value = "";
    }
  });

  // 👇 estado inicial
  if (!input.value) {
    input.value = "$";
  }
}
function animarBarra(porcentaje) {
  const barra = document.getElementById("barraObjetivo");
  const porcentajeEl = document.querySelector(".porcentaje-barra");

  if (!barra) return;

  let actual = porcentajeAnterior;
  let velocidad = 0.2;

  function animar() {
    velocidad += 0.025;
    actual += velocidad;

    if (actual > porcentaje) actual = porcentaje;

    barra.style.width = actual + "%";

    if (porcentajeEl) {
      porcentajeEl.style.left = actual + "%";
    }

    // 🎨 color
    if (actual < 30) {
      barra.style.background = "linear-gradient(90deg, #ef4444, #f87171)";
    } else if (actual < 70) {
      barra.style.background = "linear-gradient(90deg, #f59e0b, #fbbf24)";
    } else {
      barra.style.background = "linear-gradient(90deg, #22c55e, #4ade80)";
    }

    // ✨ glow
    barra.style.boxShadow =
      actual > 90 ? "0 0 12px rgba(34,197,94,0.7)" : "none";

    // 🎯 COMPLETADO (CORRECTO)
    const obj = objetivos[objetivoActivo];

    if (
      obj &&
      porcentaje >= 100 &&
      obj.meta > 0 &&
      obj.actual > 0 &&
      !obj.completado
    ) {
      obj.completado = true;
      localStorage.setItem("objetivos", JSON.stringify(objetivos));

      mostrarToast("🎉 ¡Objetivo completado!");

      setTimeout(() => {
        abrirConfirmacion(
          "¿Querés eliminar el objetivo?",
          () => eliminarObjetivo(objetivoActivo)
        );
      }, 400);
      lanzarConfetti();
    }

    if (actual < porcentaje) {
      requestAnimationFrame(animar);
    } else {
      barra.style.width = porcentaje + "%";
      porcentajeAnterior = porcentaje;
    }
  }

  animar();
}
function abrirConfirmacion(texto, callback) {
  const modal = document.getElementById("modalConfirmar");
  const textoEl = document.getElementById("textoConfirmar");

  textoEl.textContent = texto;
  accionPendiente = callback;

  modal.classList.add("activo");
}

function cancelarConfirmacion() {
  const modal = document.getElementById("modalConfirmar");
  modal.classList.remove("activo");
  accionPendiente = null;
}

function confirmarAccion() {
  if (accionPendiente) accionPendiente();

  cancelarConfirmacion();
}
function ejecutarRetiro(monto) {
  const obj = objetivos[objetivoActivo];
  const actual = Number(obj.actual) || 0;

  obj.actual = actual - monto;

  localStorage.setItem("objetivos", JSON.stringify(objetivos));

  renderObjetivo();
  renderListaObjetivos();

  mostrarToast("💸 Retiro realizado");

    cerrarModalMovimiento();
  cancelarConfirmacion();
}
function ejecutarSuma(monto) {
  const obj = objetivos[objetivoActivo];
  const actual = Number(obj.actual) || 0;

  obj.actual = actual + monto;

  localStorage.setItem("objetivos", JSON.stringify(objetivos));

  renderObjetivo();
  renderListaObjetivos();

  mostrarToast("🎯 Objetivo completado");

  cancelarConfirmacion();
}
let tipoMovimiento = null;

function abrirModalMovimiento(tipo) {
  tipoMovimiento = tipo;

  const modal = document.getElementById("modalMovimiento");
  const titulo = document.getElementById("tituloMovimiento");

  titulo.textContent =
    tipo === "sumar" ? "Agregar dinero" : "Retirar dinero";
  modal.classList.add("activo");

  const input = document.getElementById("inputMovimiento");
  input.value = "";
  input.focus();
}

function cerrarModalMovimiento() {
  const modal = document.getElementById("modalMovimiento");

  modal.classList.remove("activo");

  // opcional si querés delay futuro
}

function confirmarMovimiento() {
  const input = document.getElementById("inputMovimiento");
  let monto = Number(input.value.replace(/\D/g, ""));

  if (!monto) {
    mostrarToast("Ingresá un monto", "error");
    return;
  }

  if (objetivoActivo === null || objetivos.length === 0) {
    mostrarToast("Seleccioná un objetivo", "error");
    return;
  }

  const obj = objetivos[objetivoActivo];
  const actual = Number(obj.actual) || 0;

  // 🔴 RETIRAR
  if (tipoMovimiento === "restar") {
    if (monto > actual) {
      mostrarToast(`❌ Máximo: $${formatearMonto(actual)}`, "error");
      return;
    }

    obj.actual = actual - monto;

    mostrarToast("💸 Retiro realizado");
  }

// 🟢 SUMAR
if (tipoMovimiento === "sumar") {

  const meta = Number(obj.meta) || 0;

  if (meta <= 0) {
    mostrarToast("❌ Meta inválida", "error");
    return;
  }

  if (actual >= meta) {
    mostrarToast("✔ Ya completaste el objetivo");
    return;
  }

  const restante = meta - actual;

  if (monto > restante) {
    obj.actual = meta;
    mostrarToast(`🎯 Se agregaron $${formatearMonto(restante)} (completado)`);
  } else {
    obj.actual = actual + monto;
    mostrarToast(`💰 Se agregaron $${formatearMonto(monto)}`);
  }
}

  // 💾 GUARDAR
  localStorage.setItem("objetivos", JSON.stringify(objetivos));

  // 🔄 UI
  renderObjetivo();
  renderListaObjetivos();

  cerrarModalMovimiento();
}
function eliminarObjetivo(index) {
  if (index === null || index === undefined) return;

  const obj = objetivos[index];
  let fueGuardado = false;

  // 👉 SOLO guardar si está completado
  if (obj.actual >= obj.meta) {
    historialObjetivos.push({
      ...obj,
      fechaCompletado: new Date().toISOString()
    });

    localStorage.setItem("historialObjetivos", JSON.stringify(historialObjetivos));
    fueGuardado = true;
  }

  // ❌ eliminar
  objetivos.splice(index, 1);

  // 👉 ajustar activo
  if (objetivos.length === 0) {
    objetivoActivo = null;
  } else if (index >= objetivos.length) {
    objetivoActivo = objetivos.length - 1;
  }

  // 💾 guardar
  localStorage.setItem("objetivos", JSON.stringify(objetivos));
  localStorage.setItem("objetivoActivo", JSON.stringify(objetivoActivo));

  // 🔄 UI
  renderObjetivo();
  renderListaObjetivos();
  actualizarEstadoAhorro(); // 👈 CLAVE

  // 🔔 feedback correcto
  if (fueGuardado) {
    mostrarToast("🏆 Objetivo guardado en historial");
  } else {
    mostrarToast("🗑️ Objetivo eliminado");
  }
}
function lanzarConfetti() {
  for (let i = 0; i < 25; i++) {
    const conf = document.createElement("div");
    conf.className = "confetti";

    conf.style.left = Math.random() * 100 + "%";
    conf.style.background = `hsl(${Math.random()*360}, 80%, 60%)`;

    document.body.appendChild(conf);

    setTimeout(() => conf.remove(), 1500);
  }
}
function renderLogros() {
  const cont = document.getElementById("listaLogros");
  if (!cont) return;

  if (historialObjetivos.length === 0) {
    cont.innerHTML = `
      <div style="text-align:center; opacity:0.6; padding:20px;">
        <div style="font-size:28px;">🏆</div>
        <div>No completaste objetivos todavía</div>
      </div>
    `;
    return;
  }

  cont.innerHTML = historialObjetivos.map(obj => `
    <div class="logro ok">
      
      <div class="logro-icono">🏆</div>

      <div class="logro-info">
        <div class="logro-nombre">${obj.nombre}</div>
        <div class="logro-desc">
          $${formatearMonto(obj.meta)} • 
          ${new Date(obj.fechaCompletado).toLocaleDateString("es-AR")}
        </div>
      </div>

    </div>
  `).join("");
}
function abrirLogros() {
  const modal = document.getElementById("modalLogros");
  if (!modal) return;

  modal.classList.add("activo");

  renderLogros(); // 👈 importante
}

function cerrarLogros() {
  const modal = document.getElementById("modalLogros");
  if (!modal) return;

  modal.classList.remove("activo");
}
function actualizarEstadoAhorro() {
  const botones = document.querySelectorAll(".acciones-ahorro button");

  if (objetivos.length === 0 || objetivoActivo === null) {
    botones.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    });
  } else {
    botones.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    });
  }
}
function initFecha() {
  const inputFecha = document.getElementById("fecha");

  if (!inputFecha) return;

  inputFecha.addEventListener("click", () => {
    inputFecha.showPicker();
  });
}

function init() {
  mostrarGastos();
  actualizarAhorroUI();
  generarCalendario();
}

document.addEventListener("DOMContentLoaded", () => {
 
  const inputDesc = document.getElementById("descripcion");
  const btnRetirar = document.querySelector(".acciones .retirar");
if (btnRetirar) {
  btnRetirar.id = "btnRetirar";
}

inputDesc.addEventListener("input", (e) => {
  let valor = e.target.value;
  e.target.value = valor.charAt(0).toUpperCase() + valor.slice(1);
});

  // 👇 primero inicializaciones
  initFecha();

  // 👇 render inicial
  renderObjetivo();
  renderListaObjetivos();
  renderSelectorObjetivo();
  actualizarEstadoAhorro();

  // 👇 inputs con formato $
formatearInputMoneda(document.getElementById("nuevoMonto"));
  formatearInputMoneda(document.getElementById("monto"));
formatearInputMoneda(document.getElementById("inputMovimiento"));
document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalMovimiento");

  if (modal && e.target === modal) {
    cerrarModalMovimiento();
  }
});
  // 👇 init general
  init();
});