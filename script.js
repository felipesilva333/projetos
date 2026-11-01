import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jwaxlffedsjxatuewjef.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YXhsZmZlZHNqeGF0dWV3amVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDQwNDYsImV4cCI6MjEwODc4MDA0Nn0.otroClzeBiS7bTiec_lXmNu-61r48zgI9EFestBuVc4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let cidadeAtual = null;

const inputCidade = document.getElementById("inputCidade");
const btnBuscar = document.getElementById("btnBuscar");
const resultadoBusca = document.getElementById("resultadoBusca");
const resNomeCidade = document.getElementById("resNomeCidade");
const resPais = document.getElementById("resPais");
const resTemp = document.getElementById("resTemp");
const btnSalvarFavorito = document.getElementById("btnSalvarFavorito");
const listaFavoritos = document.getElementById("listaFavoritos");

btnBuscar.addEventListener("click", buscarClima);
btnSalvarFavorito.addEventListener("click", salvarFavorito);
document.addEventListener("DOMContentLoaded", listarFavoritos);

async function buscarClima() {
  const nome = inputCidade.value.trim();
  if (!nome) return alert("Digite o nome de uma cidade!");

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=1&language=pt&format=json`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      alert("Cidade não encontrada!");
      return;
    }

    const local = geoData.results[0];
    const climaRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${local.latitude}&longitude=${local.longitude}&current_weather=true`);
    const climaData = await climaRes.json();

    cidadeAtual = {
      nome: local.name,
      pais: local.country || "N/A",
      temp: climaData.current_weather.temperature
    };

    resNomeCidade.innerText = cidadeAtual.nome;
    resPais.innerText = cidadeAtual.pais;
    resTemp.innerText = cidadeAtual.temp;
    resultadoBusca.classList.remove("hidden");
  } catch (err) {
    console.error("Erro na busca:", err);
    alert("Erro ao buscar clima. Verifique a conexão.");
  }
}

async function salvarFavorito() {
  if (!cidadeAtual) return;

  const { error } = await supabase.from("cidades_favoritas").insert({
    nome_cidade: cidadeAtual.nome,
    pais: cidadeAtual.pais,
    temperatura: cidadeAtual.temp
  });

  if (error) {
    console.error("Erro ao salvar:", error);
    alert("Erro do Supabase: " + error.message);
  } else {
    alert("Salvo com sucesso!");
    listarFavoritos();
  }
}

async function listarFavoritos() {
  const { data, error } = await supabase
    .from("cidades_favoritas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao listar:", error);
    return;
  }

  listaFavoritos.innerHTML = "";
  if (data.length === 0) {
    listaFavoritos.innerHTML = "<li>Nenhuma cidade salva ainda.</li>";
    return;
  }

  data.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div><strong>${item.nome_cidade}</strong> (${item.pais}) — ${item.temperatura}°C</div>
      <button class="btn-excluir">Excluir</button>
    `;
    li.querySelector(".btn-excluir").addEventListener("click", () => removerFavorito(item.id));
    listaFavoritos.appendChild(li);
  });
}

async function removerFavorito(id) {
  const { error } = await supabase.from("cidades_favoritas").delete().eq("id", id);
  if (!error) {
    listarFavoritos();
  } else {
    alert("Erro ao excluir: " + error.message);
  }
}