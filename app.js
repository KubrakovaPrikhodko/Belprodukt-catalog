/* app.js */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------------- i18n RU/KZ ---------------- */
const dict = {
  ru: {
    "nav.home": "Главная",
    "nav.catalog": "Каталог",
    "nav.stores": "Где купить",
    "hero.title": "Каталог «Белорусские продукты»",
    "hero.text": "Натуральные продукты из Беларуси. Доставляем вкус и качество.",
    "hero.cta": "Перейти в каталог",
    "controls.search": "Поиск",
    "controls.category": "Категория",
    "controls.all": "Все товары",
    "controls.sort": "Сортировка",
    "controls.sortName": "По названию",
    "controls.sortCheap": "Сначала дешевле",
    "controls.sortExpensive": "Сначала дороже",
    "btn.details": "Подробнее",
    "btn.favorite": "В избранное",
    "btn.inFavorites": "В избранном"
  },
  kz: {
    "nav.home": "Басты бет",
    "nav.catalog": "Каталог",
    "nav.stores": "Қайдан сатып алу",
    "hero.title": "«Беларусь өнімдері» каталогы",
    "hero.text": "Беларусьтен табиғи өнімдер. Дәм мен сапа.",
    "hero.cta": "Каталогқа өту",
    "controls.search": "Іздеу",
    "controls.category": "Санат",
    "controls.all": "Барлығы",
    "controls.sort": "Сұрыптау",
    "controls.sortName": "Атауы бойынша",
    "controls.sortCheap": "Арзанынан",
    "controls.sortExpensive": "Қымбатынан",
    "btn.details": "Толығырақ",
    "btn.favorite": "Таңдаулыға",
    "btn.inFavorites": "Таңдаулыда"
  }
};
let lang = localStorage.getItem('lang') || 'ru';
function applyI18n() {
  $$('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    el.textContent = (dict[lang] && dict[lang][key]) || el.textContent;
  });
  $('#lang-ru')?.setAttribute('aria-pressed', lang==='ru');
  $('#lang-kz')?.setAttribute('aria-pressed', lang==='kz');
}
$('#lang-ru')?.addEventListener('click', ()=>{ lang='ru'; localStorage.setItem('lang','ru'); applyI18n(); });
$('#lang-kz')?.addEventListener('click', ()=>{ lang='kz'; localStorage.setItem('lang','kz'); applyI18n(); });

/* --------------- Каталог -------------------- */
const state = { products: [], favorites: new Set(JSON.parse(localStorage.getItem('favorites')||'[]')) };

function formatPrice(p){ return new Intl.NumberFormat('ru-KZ',{style:'currency',currency:'KZT',maximumFractionDigits:0}).format(p); }

function renderCategories(){
  const cats = Array.from(new Set(state.products.map(p=>p.category))).sort();
  const sel = $('#category');
  cats.forEach(c=>{
    const o=document.createElement('option');
    o.value=c; o.textContent=c; sel.appendChild(o);
  });
}

function renderGrid(){
  const grid = $('#grid'); if(!grid) return;
  const q = $('#search').value.trim().toLowerCase();
  const cat = $('#category').value;
  const sort = $('#sort').value;

  let items = state.products.filter(p=>{
    const okCat = cat==='all' || p.category===cat;
    const okSearch = !q || (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    return okCat && okSearch;
  });

  if (sort==='name') items.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
  if (sort==='priceAsc') items.sort((a,b)=>a.price-b.price);
  if (sort==='priceDesc') items.sort((a,b)=>b.price-a.price);

  grid.innerHTML = '';
  items.forEach(p=>{
    const li = document.createElement('li');
    li.className='card';
    li.innerHTML = `
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="content">
        <div class="meta">${p.category}</div>
        <h3>${p.name}</h3>
        <div class="price">${formatPrice(p.price)}</div>
      </div>
      <div class="actions">
        <button class="primary" data-id="${p.id}" data-act="details">${dict[lang]["btn.details"]||"Подробнее"}</button>
        <button data-id="${p.id}" data-act="fav">${state.favorites.has(p.id) ? (dict[lang]["btn.inFavorites"]||"В избранном") : (dict[lang]["btn.favorite"]||"В избранное")}</button>
      </div>`;
    grid.appendChild(li);
  });
  grid.setAttribute('aria-busy','false');
}

async function loadProducts(){
  try{
    const res = await fetch('./products.json',{cache:'no-store'});
    state.products = await res.json();
    renderCategories(); renderGrid(); applyI18n();
  }catch(e){
    console.error('Не удалось загрузить products.json', e);
    $('#grid').innerHTML = `<li class="card"><div class="content"><h3>Нет данных</h3><p>Проверьте подключение к интернету.</p></div></li>`;
  }
}

$('#search')?.addEventListener('input', renderGrid);
$('#category')?.addEventListener('change', renderGrid);
$('#sort')?.addEventListener('change', renderGrid);
$('#grid')?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const id = Number(btn.dataset.id);
  const act = btn.dataset.act;
  if(act==='fav'){
    if(state.favorites.has(id)){ state.favorites.delete(id); } else { state.favorites.add(id); }
    localStorage.setItem('favorites', JSON.stringify([...state.favorites]));
    renderGrid();
  }
  if(act==='details'){
    const p = state.products.find(x=>x.id===id);
    if(p) alert(`${p.name}\n\n${p.description}\nЦена: ${formatPrice(p.price)}`);
  }
});

/* --------------- Карта магазинов ----------- */
async function initStores(){
  const list = $('#store-list');
  try{
    const res = await fetch('./stores.json',{cache:'no-store'});
    const stores = await res.json();
    // лист (офлайн список)
    list.innerHTML = stores.map(s=>`<li><strong>${s.name}</strong> — ${s.address}</li>`).join('');

    // карта
    if (window.L) {
      const map = L.map('map', {scrollWheelZoom:false}).setView([43.653,51.197], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      stores.forEach(s=>{
        L.marker([s.lat,s.lng]).addTo(map).bindPopup(`<strong>${s.name}</strong><br>${s.address}`);
      });
    } else {
      // если Leaflet не загрузился — покажем только список
      $('#map').style.display='none';
    }
  }catch(e){
    console.warn('stores.json offline?', e);
    $('#map').style.display='none';
    list.innerHTML = '<li>Список недоступен. Откройте страницу при интернете, и она запомнится офлайн.</li>';
  }
}

/* --------------- init ---------------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  $('#year').textContent = new Date().getFullYear();
  applyI18n();
  if ($('#home-page')) loadProducts();
  if ($('#stores-page')) initStores();
});
