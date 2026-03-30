// src/data/showDates.js

/** Grouped for UI (e.g. optgroups). Order of tours is preserved. */
export const SHOW_DATES_BY_TOUR = [
  {
    tour: 'Past Shows',
    shows: [
      { date: '2026-01-28', venue: 'Moon Palace, Cancun, MX' },
      { date: '2026-01-29', venue: 'Moon Palace, Cancun, MX' },
      { date: '2026-01-30', venue: 'Moon Palace, Cancun, MX' },
      { date: '2026-01-31', venue: 'Moon Palace, Cancun, MX' },
    ],
  },
  {
    tour: 'Sphere Run',
    shows: [
      { date: '2026-04-16', venue: 'Sphere, Las Vegas, NV' },
      { date: '2026-04-17', venue: 'Sphere, Las Vegas, NV' },
      { date: '2026-04-18', venue: 'Sphere, Las Vegas, NV' },
      { date: '2026-04-23', venue: 'Sphere, Las Vegas, NV' },
      { date: '2026-04-24', venue: 'Sphere, Las Vegas, NV' },
      { date: '2026-04-25', venue: 'Sphere, Las Vegas, NV' },
      { date: '2026-04-30', venue: 'Sphere, Las Vegas, NV' },
      { date: '2026-05-01', venue: 'Sphere, Las Vegas, NV' },
      { date: '2026-05-02', venue: 'Sphere, Las Vegas, NV' },
    ],
  },
  {
    tour: 'Summer Tour',
    shows: [
      { date: '2026-07-07', venue: 'Kohl Center, Madison, WI' },
      { date: '2026-07-08', venue: 'Kohl Center, Madison, WI' },
      { date: '2026-07-10', venue: 'Ruoff Music Center, Noblesville, IN' },
      { date: '2026-07-11', venue: 'Ruoff Music Center, Noblesville, IN' },
      { date: '2026-07-12', venue: 'Ruoff Music Center, Noblesville, IN' },
      { date: '2026-07-14', venue: 'Enmarket Arena, Savannah, GA' },
      { date: '2026-07-15', venue: 'Enmarket Arena, Savannah, GA' },
      { date: '2026-07-17', venue: 'Coastal Credit Union Music Park at Walnut Creek, Raleigh, NC' },
      { date: '2026-07-18', venue: 'Merriweather Post Pavilion, Columbia, MD' },
      { date: '2026-07-19', venue: 'Merriweather Post Pavilion, Columbia, MD' },
      { date: '2026-07-21', venue: 'Empower Federal Credit Union Amphitheater at Lakeview, Syracuse, NY' },
      { date: '2026-07-22', venue: 'Madison Square Garden, New York, NY' },
      { date: '2026-07-24', venue: 'Madison Square Garden, New York, NY' },
      { date: '2026-07-25', venue: 'Madison Square Garden, New York, NY' },
      { date: '2026-07-27', venue: 'Madison Square Garden, New York, NY' },
      { date: '2026-07-29', venue: 'Madison Square Garden, New York, NY' },
      { date: '2026-07-31', venue: 'Fenway Park, Boston, MA' },
      { date: '2026-08-01', venue: 'Fenway Park, Boston, MA' },
      { date: '2026-09-04', venue: "Dick's Sporting Goods Park, Commerce City, CO" },
      { date: '2026-09-05', venue: "Dick's Sporting Goods Park, Commerce City, CO" },
      { date: '2026-09-06', venue: "Dick's Sporting Goods Park, Commerce City, CO" },
    ],
  },
];

/** Flat list (chronological) for logic that only needs dates — e.g. next show. */
export const SHOW_DATES = SHOW_DATES_BY_TOUR.flatMap((g) => g.shows);
