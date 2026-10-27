import index from '../data/player-index.json';

// 선수검색 색인(scripts/export_players.py가 만듦). 선수 검색창(PlayerSearch.astro)이 처음 입력할 때 받아 브라우저 안에서 찾는다.
// 줄 = [id, 이름, b|p(타자·투수), 마지막 팀, 포지션, 첫 시즌, 마지막 시즌, 뛴 팀들]
export function GET() {
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
