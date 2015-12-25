import _ from 'ramda'

const mapSum = // matrix -> list
    _.map(_.sum)

const transpose = // matrix -> matrix
  matrix => matrix[0].map((cell, index) => matrix.map(row => row[index]))

const diagonal = // matrix -> list
  matrix => matrix.map((row, index) => matrix[index][index])

const sumVertical = // matrix -> list
  _.compose(mapSum, transpose)

const sumDiagonalLR = // matrix -> list
  _.compose(_.sum, diagonal)

const sumDiagonalRL = // matrix -> list
  _.compose(_.sum, diagonal, _.reverse)

export default // ([array], integer) -> boolean
  (matrix, length) => {
   return (
        Math.abs(sumDiagonalLR(matrix)) === length
     || Math.abs(sumDiagonalRL(matrix)) === length
     || mapSum(matrix).some(n => Math.abs(n) === length)
     || sumVertical(matrix).some(n => Math.abs(n) === length)
    )
  }

export const randomMove =
  (matrix, length) => {
    let choice, x, y
    while (choice !== 0) {
      x = Math.floor(Math.random() * 3)
      y = Math.floor(Math.random() * 3)
      choice = matrix[x][y]
    }
    return matrix.map((row, i) => {
      if (i === x) {
        return row.map((cell, i) => {
          if (i === y) {
            return length % 2 === 0 ? 1 : -1
          } else {
            return cell
          }
        })
      } else {
        return row
      }
    })
  }
