import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { ReactElement } from 'react'

import ErrorFilePath from './error-file-path'
import Err from './err-model'

const cypressLineRegex = /(cypress:\/\/|cypress_runner\.js)/

interface Props {
  err: Err,
}

type StringOrElement = string | ReactElement

const ErrorStack = observer(({ err }: Props) => {
  if (!err.parsedStack) return <>err.stack</>

  // only display stack lines beyond the original message, since it's already
  // displayed above this
  let foundFirstStackLine = false
  const stackLines = _.filter(err.parsedStack, ({ message }) => {
    if (foundFirstStackLine) return true

    if (message != null) return false

    foundFirstStackLine = true

    return true
  })
  // instead of having every line indented, get rid of the smallest amount of
  // whitespace common to each line so the stack is aligned left but lines
  // with extra whitespace still have it
  const whitespaceLengths = _.map(stackLines, ({ whitespace }) => whitespace ? whitespace.length : 0)
  const commonWhitespaceLength = Math.min(...whitespaceLengths)

  const makeLine = (key: string, content: StringOrElement[]) => {
    return (
      <div className='err-stack-line' key={key}>{content}</div>
    )
  }

  const lines = _.map(stackLines, (stackLine, index) => {
    const { relativeFile, function: fn, line, column } = stackLine
    const key = `${relativeFile}${index}`

    const whitespace = stackLine.whitespace.slice(commonWhitespaceLength)

    if (stackLine.message != null) {
      return makeLine(key, [whitespace, stackLine.message])
    }

    if (cypressLineRegex.test(relativeFile || '')) {
      return makeLine(key, [whitespace, `at ${fn} (${relativeFile}:${line}:${column})`])
    }

    const link = (
      <ErrorFilePath key={key} fileDetails={stackLine} />
    )

    return makeLine(key, [whitespace, `at ${fn} (`, link, ')'])
  })

  return <>{lines}</>
})

export default ErrorStack