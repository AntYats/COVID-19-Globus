const colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd).exponent(1 / 4);
const getVal = feat => feat.covid.total / Math.max(1e5, feat.properties.POP_EST);

let world;

const beautifulNumber = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

const init = () => {
    getData();
    world = Globe()
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .showGraticules(false)
        .polygonAltitude(0.06)
        .polygonCapColor((feat) => colorScale(getVal(feat)))
        .polygonSideColor(() => 'rgba(0, 100, 0, 0.05)')
        .polygonStrokeColor(() => '#111')
        .polygonLabel(({
            properties: d,
            covid: c
        }) => `
        <div class="card">
            <h3 class="card_title">Страна: ${d.NAME}</h3>
            <h5 class="card_info">Заболели: ${beautifulNumber(c.total)}</h5>
            <h5 class="card_info">Смертей: ${beautifulNumber(c.deaths)}</h5>
            <h5 class="card_info">Вылечились: ${beautifulNumber(c.recovered)}</h5>
        </div>
    `)
        .onPolygonHover(hoverD => world
            .polygonAltitude(d => d === hoverD ? 0.12 : 0.06)
            .polygonCapColor(d => d === hoverD ? 'steelblue' : colorScale(getVal(d)))
        )
        .polygonsTransitionDuration(200)(document.getElementById('globeViz'))
}

let covidData = [];
let featureCollection = [];

const getData = async() => {
    const countries = await fetch('https://raw.githubusercontent.com/vasturiano/aframe-globe-component/master/examples/datasets/ne_110m_admin_0_countries.geojson');
    const countriesData = await countries.json();
    featureCollection = await countriesData.features;

    const covidStats = await fetch('https://api.covid19api.com/summary');
    const covidStatsData = await covidStats.json();
    covidData = await covidStatsData;

    document.querySelector('.total').textContent = beautifulNumber(covidData.Global.TotalConfirmed);
    document.querySelector('.recovered').textContent = beautifulNumber(covidData.Global.TotalRecovered);
    document.querySelector('.deaths').textContent = beautifulNumber(covidData.Global.TotalDeaths);

    updatePolygonData();
}

function updatePolygonData() {
    for (let i = 0; i < featureCollection.length; i++) {
        let countryName = featureCollection[i].properties.ISO_A2;
        if (countryName) {
            let objData = covidData.Countries.find(j => j.CountryCode === countryName);
            if (objData) {
                featureCollection[i].covid = {
                    total: objData.TotalConfirmed,
                    deaths: objData.TotalDeaths,
                    recovered: objData.TotalRecovered
                }
            }
            else {
                featureCollection[i].covid = {
                    total: 0,
                    deaths: 0,
                    recovered: 0
                }
            }
        }
    }

    const maxVal = Math.max(...featureCollection.map(getVal));
    colorScale.domain([0, maxVal]);
    world.polygonsData(featureCollection);
}

window.addEventListener('resize', (e) => {
    world.width([e.target.innerWidth]);
    world.height([e.target.innerHeight]);
});

init();
