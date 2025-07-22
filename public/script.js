const form = document.getElementById('calcForm');
const resultsEl = document.getElementById('results');
const summaryEl = document.getElementById('summary');
const tableBody = document.querySelector('#resultsTable tbody');
const ctx = document.getElementById('chart').getContext('2d');
let myChart = null;

form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  const res = await fetch('/api/retirement', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  const json = await res.json();

  // Show summary
  summaryEl.textContent = `Total at retirement: $${json.total_savings.toLocaleString()}`;
  resultsEl.classList.remove('d-none');

  // Populate table
  tableBody.innerHTML = '';
  json.table.forEach(r => {
    const tr = document.createElement('tr');
    ['year','age','start','withdrawal','other','pension','ss','total_income','expenses','end']
      .forEach(key => {
        const td = document.createElement('td');
        td.textContent = typeof r[key] === 'number'
          ? r[key].toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})
          : r[key];
        tr.appendChild(td);
      });
    tableBody.appendChild(tr);
  });

  // Prepare chart data
  const labels = json.table.map(r => r.age);
  const dataPoints = json.table.map(r => r.end);

  // Destroy old chart
  if (myChart) myChart.destroy();

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(54,162,235,0.6)');
  gradient.addColorStop(1, 'rgba(54,162,235,0.1)');

  // Build new chart
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'End Balance',
        data: dataPoints,
        backgroundColor: ctx => dataPoints.map(v =>
          v >= 0 ? gradient : 'rgba(255,99,132,0.6)'
        ),
        borderColor: ctx => dataPoints.map(v =>
          v >= 0 ? 'rgba(54,162,235,1)' : 'rgba(255,99,132,1)'
        ),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `$${ctx.parsed.y.toLocaleString()}`
          }
        },
        title: {
          display: true,
          text: 'Projected Balance by Age',
          font: { size: 18 }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Age' } },
        y: {
          title: { display: true, text: 'Balance ($)' },
          ticks: {
            callback: v => `$${v.toLocaleString()}`
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });
});