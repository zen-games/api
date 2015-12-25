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
