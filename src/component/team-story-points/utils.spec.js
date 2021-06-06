import { isPointed, isPointReveal, sortListByHighestStoryPoints, groupByStoryPoints } from './utils'

describe('utils.isPointed()', () => {
  describe.each`
            points  | expectations
            ${'1'}  | ${true}
            ${1}    | ${true}
            ${5}    | ${true}
            ${'5'}  | ${true}
            ${'-1'} | ${false}
            ${-1}   | ${false}
            ${'-2'} | ${true}
            ${-2}   | ${true}
          `(
    'When story points is $points',
    ({ points, expectations }) => {
      let member
      beforeEach(() => {
        member = { name: 'test', points }
      })

      it(`Then it should return "${expectations ? 'true' : 'false'}"`, () => {
        expect(isPointed(member)).toEqual(expectations)
      })
    }
  )
})

describe('utils.isPointReveal()', () => {
  describe.each`
            points  | expectations
            ${'1'}  | ${true}
            ${1}    | ${true}
            ${5}    | ${true}
            ${'5'}  | ${true}
            ${'-1'} | ${false}
            ${-1}   | ${false}
            ${'-2'} | ${false}
            ${-2}   | ${false}
          `(
    'When story points is $points',
    ({ points, expectations }) => {
      let member
      beforeEach(() => {
        member = { name: 'test', points }
      })

      it(`Then it should return "${expectations ? 'true' : 'false'}"`, () => {
        expect(isPointReveal(member)).toEqual(expectations)
      })
    }
  )
})

describe('utils.sortListByHighestStoryPoints()', () => {
  describe.each`
            names                                                     | points                        | expectedOrder
            ${['Ali', 'Oliver', 'Harry', 'George', 'Oscar', 'Jack']}  | ${['3', '11', 5, 8, 3, '3']}  | ${['Oliver', 'George', 'Harry', 'Ali', 'Jack', 'Oscar']}
            ${['Ali', 'Oliver', 'Harry', 'George', 'Oscar', 'Jack']}  | ${['-1', -1, 5, 8, 3, '3']}   | ${['George', 'Harry', 'Jack', 'Oscar', 'Ali', 'Oliver']}
          `(
    'When story points is $points',
    ({ names, points, expectedOrder }) => {
      let members
      beforeEach(() => {
        members = names.map((name, index) => ({ name, points: points[index] }))
      })

      it('Then it should sort Array list by highest points and members ASC', () => {
        expect(sortListByHighestStoryPoints(members).map(({ name }) => name)).toEqual(expectedOrder)
      })
    }
  )
})

describe('utils.groupByStoryPoints()', () => {
  let members

  beforeEach(() => {
    members = [
      { name: 'Ali', points: 3 },
      { name: 'Oliver', points: '11' },
      { name: 'Harry', points: 5 },
      { name: 'George', points: 5 },
      { name: 'Oscar', points: -1 },
      { name: 'Jack', points: '-1' },
      { name: 'Steph', points: -2 },
      { name: 'Kate', points: '-2' }
    ]
  })

  it('Should group Array list by story points', () => {
    expect(groupByStoryPoints(members)).toMatchInlineSnapshot(`
Map {
  11 => Array [
    "Oliver",
  ],
  5 => Array [
    "George",
    "Harry",
  ],
  3 => Array [
    "Ali",
  ],
  -1 => Array [
    "Jack",
    "Oscar",
  ],
  -2 => Array [
    "Kate",
    "Steph",
  ],
}
`)
  })
})
