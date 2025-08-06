const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db

const intializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server up!')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

intializeServerAndDb()

const converStateObjToResponseObj = stateObj => {
  return {
    stateId: stateObj.state_id,
    stateName: stateObj.state_name,
    population: stateObj.population,
  }
}

const convertDistrictObjtoResponseObj = districtObj => {
  return {
    districtId: districtObj.district_id,
    districtName: districtObj.district_name,
    stateId: districtObj.state_id,
    cases: districtObj.cases,
    cured: districtObj.cured,
    active: districtObj.active,
    deaths: districtObj.deaths,
  }
}

//API 1
app.get('/states/', async (request, response) => {
  const getAllStates = `
    SELECT *
    FROM state;`
  const allStatesArray = await db.all(getAllStates)
  const allStatesResponse = allStatesArray.map(obj =>
    converStateObjToResponseObj(obj),
  )
  response.send(allStatesResponse)
})

//API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getState = `
  SELECT *
  FROM state
  WHERE state_id = ${stateId};`
  const stateObj = await db.get(getState)
  const stateResponseObj = converStateObjToResponseObj(stateObj)
  response.send(stateResponseObj)
})

//API 3
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const addDistrict = `
  INSERT INTO
    district(district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`
  await db.run(addDistrict)
  response.send('District Successfully Added')
})

//API 4
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
  SELECT *
  FROM district
  WHERE district_id = ${districtId};`
  const districtObj = await db.get(getDistrict)
  const districtResponseObj = convertDistrictObjtoResponseObj(districtObj)
  response.send(districtResponseObj)
})

//API 5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  DELETE FROM district
  WHERE district_id = ${districtId};`
  await db.run(deleteDistrict)
  response.send('District Removed')
})

//API 6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrict = `
  UPDATE district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE district_id = ${districtId};`
  await db.run(updateDistrict)
  response.send('District Details Updated')
})

//API 7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStats = `
  SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
  FROM district
  WHERE state_id = ${stateId};
  `
  const stateStats = await db.get(getStateStats)
  response.send(stateStats)
})

//API 8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateName = `
  SELECT state_name AS stateName
  FROM state
  WHERE state_id = (SELECT state_id
                    FROM district
                    WHERE district_id = ${districtId});`
  const state = await db.get(getStateName)
  response.send(state)
})

module.exports = app
