import React, { useEffect, useState } from 'react'
import EduGamesApp from './EduGamesApp.jsx'

const LS_KEYS = {
  dataset: 'edu_dataset_v1',
}

const getDataset = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEYS.dataset) || 'null') }
  catch { return null }
}
const setDataset = (data) => localStorage.setItem(LS_KEYS.dataset, JSON.stringify(data))

export default function App(){
  const [rawData, setRawData] = useState(() => getDataset())

  useEffect(() => {
    if(!getDataset()){
      fetch('/conceptos.json')
        .then(r => r.json())
        .then(data => {
          setRawData(data)
          setDataset(data)
        })
        .catch(err => console.error('Error cargando conceptos:', err))
    }
  }, [])

  if(!rawData) return <p className="p-6 text-lg">Cargando datos…</p>

  return <EduGamesApp initialData={rawData} />
}
