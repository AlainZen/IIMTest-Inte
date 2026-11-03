// Un faux PokeAPI pour les tests e2e. Le serveur Nuxt et le navigateur l'appellent tous les deux.
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_POKEAPI_PORT ?? 3002)
const SPECIES = ['bulbasaur', 'ivysaur', 'venusaur']

function pokemon(id) {
  return {
    id,
    name: `pokemon-${id}`,
    species: { url: `/api/v2/pokemon-species/${id}/` },
    types: [{ type: { name: 'fire' } }],
    sprites: { front_default: null },
    height: 4,
    weight: 60,
    abilities: [{ ability: { name: 'lightning-rod' } }],
    stats: [
      { base_stat: 35, stat: { name: 'hp' } },
      { base_stat: 90, stat: { name: 'speed' } },
    ],
  }
}

createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost')
  const id = Number(pathname.split('/').pop())

  let status = 404
  let body = { detail: 'Not found' }

  if (pathname === '/health') {
    status = 200
    body = { status: 'ok' }
  } else if (pathname === '/pokemon-species') {
    status = 200
    body = { results: SPECIES.map(name => ({ name })) }
  } else if (pathname.startsWith('/pokemon/') && Number.isInteger(id) && id > 0) {
    status = 200
    body = pokemon(id)
  }

  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  response.end(JSON.stringify(body))
}).listen(PORT)
