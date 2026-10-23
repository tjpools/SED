import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { evaluateSed } from './sed'
import './styles.css'

type Lesson = {
  title: string
  concept: string
  input: string
  starter: string
  expected: string
  hint: string
}

const lessons: Lesson[] = [
  {
    title: 'Make your first substitution',
    concept: 'The s command replaces the first matching value on each line: s/old/new/.',
    input: 'hello linux\nhello unix',
    starter: 's/linux/Linux/',
    expected: 'hello Linux\nhello unix',
    hint: 'Put the text to find between the first two slashes, then add its replacement.',
  },
  {
    title: 'Replace every match',
    concept: 'Add the g flag to replace every match, not only the first one.',
    input: 'red red blue\nred green red',
    starter: 's/red/gold/g',
    expected: 'gold gold blue\ngold green gold',
    hint: 'The final g means global: s/red/gold/g.',
  },
  {
    title: 'Delete a line',
    concept: 'An address limits a command to one line. 2d deletes line two.',
    input: 'keep this\nremove this\nkeep this too',
    starter: '2d',
    expected: 'keep this\nkeep this too',
    hint: 'Combine the line number 2 with the delete command d.',
  },
]

function App() {
  const [lessonIndex, setLessonIndex] = useState(0)
  const lesson = lessons[lessonIndex]
  const [input, setInput] = useState(lesson.input)
  const [command, setCommand] = useState(lesson.starter)
  const [quiet, setQuiet] = useState(false)
  const [checked, setChecked] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const result = useMemo(() => evaluateSed(input, command, quiet), [input, command, quiet])
  const isCorrect = !result.error && result.output === lesson.expected

  function selectLesson(index: number) {
    const next = lessons[index]
    setLessonIndex(index)
    setInput(next.input)
    setCommand(next.starter)
    setQuiet(false)
    setChecked(false)
    setShowHint(false)
  }

  return (
    <main>
      <header>
        <a className="brand" href="#top" aria-label="sed lab home">
          <span className="prompt">$</span> sed<span className="muted">lab</span>
        </a>
        <nav aria-label="Page sections">
          <a href="#lessons">Lessons</a>
          <a href="#playground">Playground</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">A safe, browser-based command lab</p>
        <h1>Turn text into<br /><em>understanding.</em></h1>
        <p>Learn <code>sed</code> by doing. No shell, no setup, and no risk to your files.</p>
        <a className="primary" href="#lessons">Start learning <span>→</span></a>
      </section>

      <section className="learning" id="lessons">
        <aside>
          <p className="section-label">Guided lessons</p>
          <ol>
            {lessons.map((item, index) => (
              <li key={item.title}>
                <button className={index === lessonIndex ? 'active' : ''} onClick={() => selectLesson(index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>{item.title}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <article>
          <div className="lesson-count">Lesson {lessonIndex + 1} / {lessons.length}</div>
          <h2>{lesson.title}</h2>
          <p>{lesson.concept}</p>
          <div className="exercise">
            <label htmlFor="lesson-command">Complete the command</label>
            <div className="command-line">
              <span>$ sed '</span>
              <input
                id="lesson-command"
                value={command}
                onChange={(event) => { setCommand(event.target.value); setChecked(false) }}
                spellCheck={false}
              />
              <span>' input.txt</span>
            </div>
            <div className="exercise-actions">
              <button className="primary" onClick={() => setChecked(true)}>Check answer</button>
              <button className="text-button" onClick={() => setShowHint((value) => !value)}>Need a hint?</button>
            </div>
            {showHint && <p className="hint">Hint: {lesson.hint}</p>}
            {checked && (
              <p className={isCorrect ? 'feedback success' : 'feedback try-again'} role="status">
                {isCorrect ? '✓ Nice work — the output matches.' : result.error ? `Try again: ${result.error}` : 'Not quite. Compare your output and try the hint.'}
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="playground" id="playground">
        <div className="section-heading">
          <div>
            <p className="section-label">Open playground</p>
            <h2>Experiment freely.</h2>
          </div>
          <p>Supported subset: substitution (<code>s</code>), delete (<code>d</code>), print (<code>p</code>), line addresses, and <code>g</code>/<code>i</code> flags.</p>
        </div>

        <div className="workbench">
          <div className="pane">
            <label htmlFor="source">INPUT</label>
            <textarea id="source" value={input} onChange={(event) => setInput(event.target.value)} />
          </div>
          <div className="pane output-pane">
            <label htmlFor="output">OUTPUT</label>
            <pre id="output" aria-live="polite">{result.error ? `Error: ${result.error}` : result.output}</pre>
          </div>
          <div className="console">
            <span>$ sed {quiet ? '-n ' : ''}'</span>
            <input
              aria-label="sed command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              spellCheck={false}
            />
            <span>' input.txt</span>
            <label className="quiet"><input type="checkbox" checked={quiet} onChange={(event) => setQuiet(event.target.checked)} /> quiet (-n)</label>
          </div>
        </div>
        <p className="safety">Runs entirely in your browser · Never invokes a system shell</p>
      </section>

      <footer><span>sed lab</span><p>Small commands. Big leverage.</p></footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

