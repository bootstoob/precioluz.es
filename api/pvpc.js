export default async function handler(req, res) {
  const token = process.env.ESIOS_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'ESIOS_TOKEN no configurado en variables de entorno.' });
  }

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchIndicator = async (id) => {
    const url = `https://api.esios.ree.es/indicators/${id}?start_date=${formatDate(today)}T00:00:00&end_date=${formatDate(tomorrow)}T23:59:59`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'x-api-key': token
      }
    });
    if (!response.ok) {
      throw new Error(`Error al obtener indicador ${id}: HTTP ${response.status}`);
    }
    return response.json();
  };

  const processValues = (data) => {
    if (!data.indicator || !data.indicator.values) return {};
    const values = data.indicator.values.filter(v => v.geo_id === 8741);
    const grouped = {};
    values.forEach(v => {
      const dateStr = v.datetime.split('T')[0];
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push({
        hour: new Date(v.datetime).getHours(),
        price: (v.value / 1000).toFixed(5)
      });
    });
    return grouped;
  };

  try {
    const [pvpcData, marketData] = await Promise.all([
      fetchIndicator(1001),
      fetchIndicator(1022)
    ]);

    const pvpcGrouped = processValues(pvpcData);
    const marketGrouped = processValues(marketData);

    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);

    return res.status(200).json({
      today: pvpcGrouped[todayStr] || [],
      tomorrow: pvpcGrouped[tomorrowStr] || [],
      tomorrowEstimates: marketGrouped[tomorrowStr] || []
    });
  } catch (err) {
    console.error('API Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
