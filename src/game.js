import { getCaseById } from './cases'

const TOOLS = [
  {
    id: 'lieDetector',
    name: 'Lie Detector',
    cost: 1,
    help: 'Indicates deceptive statements.',
  },
  {
    id: 'stopwatch',
    name: 'Stopwatch',
    cost: 1,
    help: 'Reveals hesitation or delayed responses.',
  },
  {
    id: 'watch',
    name: 'Watch',
    cost: 1,
    help: 'Verifies time-based alibis.',
  },
  {
    id: 'notepad',
    name: 'Notepad',
    cost: 1,
    help: 'Highlights contradictions between suspects.',
  },
]

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v
    else if (k === 'dataset') Object.assign(node.dataset, v)
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v)
    else if (v === true) node.setAttribute(k, '')
    else if (v !== false && v != null) node.setAttribute(k, String(v))
  }
  for (const c of Array.isArray(children) ? children : [children]) {
    if (c == null) continue
    if (typeof c === 'string') node.appendChild(document.createTextNode(c))
    else node.appendChild(c)
  }
  return node
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function mountGame(app, { caseId = 1 } = {}) {
  const state = {
    caseId,
    phase: 'intro', // intro | investigation | interviews | deduction | accusation | resolution
    invPoints: 0,
    invPointsSpent: 0,
    completedMinigames: new Set(),
    interviewed: new Set(),
    currentSuspectId: null,
    activeToolId: null,
    toolUses: [], // {toolId, suspectId, statementId, output}
    clueLog: [],
    lastFeedback: null,
  }

  const gameCase = getCaseById(caseId)
  if (!gameCase) throw new Error(`Case not found: ${caseId}`)

  function remainingPoints() {
    return clamp(state.invPoints - state.invPointsSpent, 0, 999)
  }

  function canAccuse() {
    return state.interviewed.size === gameCase.suspects.length
  }

  function setPhase(phase) {
    state.phase = phase
    state.lastFeedback = null
    render()
  }

  function addClue(text) {
    state.clueLog.unshift({ at: Date.now(), text })
    if (state.clueLog.length > 10) state.clueLog.length = 10
  }

  function spendPoint(toolId) {
    const tool = TOOLS.find((t) => t.id === toolId)
    if (!tool) return false
    if (remainingPoints() < tool.cost) return false
    state.invPointsSpent += tool.cost
    return true
  }

  function toolSignalToLabel(toolId, signal) {
    if (!signal || signal === 'unknown') return null
    const map = {
      lieDetector: {
        green: 'No deception indicated',
        yellow: 'Unclear / possible deception',
        red: 'Deception indicated',
      },
      stopwatch: {
        green: 'No hesitation',
        yellow: 'Some hesitation',
        red: 'Notable hesitation',
      },
      watch: {
        green: 'Time claim checks out',
        yellow: 'Time claim unclear',
        red: 'Time claim conflicts',
      },
    }
    return map[toolId]?.[signal] || null
  }

  function useToolOnStatement(toolId, suspectId, statement) {
    const suspect = gameCase.suspects.find((s) => s.id === suspectId)
    if (!suspect) return

    if (!spendPoint(toolId)) {
      state.lastFeedback = `Not enough Investigation Points to use ${TOOLS.find((t) => t.id === toolId)?.name}.`
      return
    }

    const signals = statement.toolSignals || {}

    let output = ''
    if (toolId === 'notepad') {
      const notes = Array.isArray(signals.notepad) ? signals.notepad : []
      output = notes.length ? notes.join(' ') : 'No new contradictions highlighted.'
    } else {
      const signal = signals[toolId]
      const label = toolSignalToLabel(toolId, signal)
      output = label || 'No readout available.'
    }

    state.toolUses.unshift({ toolId, suspectId, statementId: statement.id, output })
    addClue(`${TOOLS.find((t) => t.id === toolId)?.name}: ${output}`)
    state.lastFeedback = `${TOOLS.find((t) => t.id === toolId)?.name} used.`
  }

  function completeMinigame(minigameId) {
    if (state.completedMinigames.has(minigameId)) return
    state.completedMinigames.add(minigameId)
    state.invPoints += 1
    addClue('Investigation complete: +1 Investigation Point.')
    state.lastFeedback = 'Minigame completed (+1 Investigation Point).'
  }

  function resetCaseProgressForRetry() {
    // No permanent game over. Allow retry with points/tools as-is (no extra systems).
    state.lastFeedback = null
    setPhase('deduction')
  }

  function renderHeader() {
    return el('header', { class: 'topbar' }, [
      el('div', { class: 'brand' }, [el('div', { class: 'badge' }, `Case ${gameCase.id}`), el('div', { class: 'title' }, gameCase.title)]),
      el('div', { class: 'phase' }, `Phase: ${state.phase.toUpperCase()}`),
    ])
  }

  function renderLeftPanel() {
    const left = el('section', { class: 'panel left' })

    const clueItems = state.clueLog.length
      ? state.clueLog.map((c) => el('li', {}, c.text))
      : [el('li', { class: 'muted' }, 'No clues logged yet.')]

    const feedback = state.lastFeedback ? el('div', { class: 'feedback' }, state.lastFeedback) : null

    left.appendChild(el('div', { class: 'leftTop' }, [
      el('h2', {}, 'Dialogue / Case Notes'),
      feedback,
    ]))

    const main = el('div', { class: 'leftMain' })
    main.appendChild(renderPhaseContent())

    const clues = el('div', { class: 'clues' }, [
      el('h3', {}, 'Clues'),
      el('ul', { class: 'clueList' }, clueItems),
    ])

    left.appendChild(main)
    left.appendChild(clues)

    return left
  }

  function renderRightPanel() {
    const right = el('section', { class: 'panel right' })

    right.appendChild(el('h2', {}, 'Suspects'))

    const grid = el('div', { class: 'suspectGrid' })
    for (const s of gameCase.suspects) {
      const interviewed = state.interviewed.has(s.id)
      const active = state.currentSuspectId === s.id
      grid.appendChild(
        el(
          'button',
          {
            class: `suspectCard ${active ? 'active' : ''}`,
            onClick: () => {
              // Always allow selecting to "preview" who you'll talk to.
              // Actual interview interaction happens in the Interviews phase.
              state.currentSuspectId = s.id
              if (state.phase !== 'interviews') {
                state.lastFeedback = 'Suspect selected. Advance to the Interviews phase to question them.'
              } else {
                state.lastFeedback = null
              }
              render()
            },
          },
          [
            el('div', { class: 'portrait' }, s.portraitLabel),
            el('div', { class: 'suspectMeta' }, [
              el('div', { class: 'suspectName' }, s.name),
              el('div', { class: 'suspectRole' }, `${s.role} • ${s.trait}`),
              el('div', { class: `suspectStatus ${interviewed ? 'done' : 'todo'}` }, interviewed ? 'Interviewed' : 'Not interviewed'),
            ]),
          ]
        )
      )
    }
    right.appendChild(grid)

    return right
  }

  function renderBottomBar() {
    const bottom = el('footer', { class: 'bottombar' })

    const quickFeedback = state.lastFeedback
      ? el('div', { class: 'quickFeedback' }, state.lastFeedback)
      : el('div', { class: 'quickFeedback muted' }, 'Tip: Tap Next to advance phases. Complete minigames to earn points for tools.')

    bottom.appendChild(
      el('div', { class: 'points' }, [
        el('div', { class: 'pointsLabel' }, 'Investigation Points'),
        el('div', { class: 'pointsValue' }, `${remainingPoints()} (earned: ${state.invPoints})`),
      ])
    )

    bottom.appendChild(quickFeedback)

    const tools = el('div', { class: 'tools' })
    tools.appendChild(el('div', { class: 'toolsLabel' }, 'Tools'))

    const toolRow = el('div', { class: 'toolRow' })
    for (const t of TOOLS) {
      const disabled = remainingPoints() < t.cost || state.phase !== 'interviews'
      const active = state.activeToolId === t.id
      toolRow.appendChild(
        el(
          'button',
          {
            class: `toolBtn ${active ? 'active' : ''}`,
            disabled,
            title: `${t.help} (Cost: ${t.cost})`,
            onClick: () => {
              state.activeToolId = state.activeToolId === t.id ? null : t.id
              state.lastFeedback = state.activeToolId ? `${t.name} armed. Tap a statement to use it.` : 'Tool unselected.'
              render()
            },
          },
          `${t.name} (-${t.cost})`
        )
      )
    }
    tools.appendChild(toolRow)
    bottom.appendChild(tools)

    const actions = el('div', { class: 'actions' })

    const accuseBtn = el(
      'button',
      {
        class: 'accuseBtn',
        disabled: state.phase !== 'accusation' || !canAccuse(),
        onClick: () => {
          state.lastFeedback = canAccuse()
            ? 'Choose a suspect to accuse from the Suspects panel.'
            : 'You must interview all suspects before accusing.'
          render()
        },
      },
      'Accuse'
    )

    actions.appendChild(accuseBtn)

    const nextBtn = el(
      'button',
      {
        class: 'nextBtn',
        onClick: () => advancePhase(),
      },
      state.phase === 'resolution' ? 'Back to Cases' : 'Next'
    )

    actions.appendChild(nextBtn)
    bottom.appendChild(actions)

    return bottom
  }

  function advancePhase() {
    const order = ['intro', 'investigation', 'interviews', 'deduction', 'accusation', 'resolution']
    const idx = order.indexOf(state.phase)

    if (state.phase === 'interviews') {
      if (state.interviewed.size !== gameCase.suspects.length) {
        state.lastFeedback = 'You must interview all suspects before proceeding.'
        render()
        return
      }
    }

    if (state.phase === 'accusation') {
      // stay in accusation until an accusation is made
      state.lastFeedback = canAccuse()
        ? 'Choose a suspect to accuse.'
        : 'You must interview all suspects before accusing.'
      render()
      return
    }

    if (state.phase === 'resolution') {
      // go back to case select
      state.phase = 'caseSelect'
      render()
      return
    }

    const next = order[idx + 1] || 'resolution'
    setPhase(next)

    if (next === 'interviews' && !state.currentSuspectId) {
      state.currentSuspectId = gameCase.suspects[0]?.id || null
    }

    if (next === 'accusation') {
      // enforce rule
      if (!canAccuse()) {
        setPhase('deduction')
        state.lastFeedback = 'You must interview all suspects before accusing.'
      }
    }
  }

  function renderPhaseContent() {
    if (state.phase === 'caseSelect') return renderCaseSelect()

    if (state.phase === 'intro') {
      return el('div', { class: 'phaseContent' }, [
        el('h3', {}, 'Case Introduction'),
        el('p', { class: 'lead' }, gameCase.crime),
        el('p', { class: 'muted' },
          'Sequence: Introduction → Investigation (optional minigames) → Interviews (mandatory) → Deduction → Accusation → Resolution.'
        ),
        el('div', { class: 'tip' }, 'Tip: Minigames are optional, but they award Investigation Points for tools.'),
      ])
    }

    if (state.phase === 'investigation') {
      return renderInvestigation()
    }

    if (state.phase === 'interviews') {
      return renderInterviews()
    }

    if (state.phase === 'deduction') {
      return el('div', { class: 'phaseContent' }, [
        el('h3', {}, 'Deduction'),
        el(
          'p',
          {},
          'Review what each suspect said. Use tools (if you earned points) to reveal subtle deception and timeline inconsistencies. The case is solvable through logic—guessing is discouraged.'
        ),
        el('button', { class: 'primary', onClick: () => setPhase('accusation'), disabled: !canAccuse() },
          canAccuse() ? 'Proceed to Accusation' : 'Interview all suspects to proceed'
        ),
      ])
    }

    if (state.phase === 'accusation') {
      return renderAccusation()
    }

    if (state.phase === 'resolution') {
      return el('div', { class: 'phaseContent' }, [
        el('h3', {}, 'Resolution'),
        el('p', {}, gameCase.resolution),
        el('div', { class: 'tip' }, 'Investigation Points reset between cases.'),
      ])
    }

    return el('div', { class: 'phaseContent' }, 'Unknown phase')
  }

  function renderCaseSelect() {
    // Minimal case select for now: restart case 1.
    const wrap = el('div', { class: 'phaseContent' }, [
      el('h3', {}, 'Cases'),
      el('p', { class: 'muted' }, '20 cases supported. Case 1 is fully implemented; cases 2–20 are placeholders.'),
      el('button', { class: 'primary', onClick: () => restartCase(1) }, 'Play Case 1'),
    ])
    return wrap
  }

  function restartCase(id) {
    // reload without adding extra save systems
    state.caseId = id
    state.phase = 'intro'
    state.invPoints = 0
    state.invPointsSpent = 0
    state.completedMinigames = new Set()
    state.interviewed = new Set()
    state.currentSuspectId = null
    state.activeToolId = null
    state.toolUses = []
    state.clueLog = []
    state.lastFeedback = null
    // remount by simply hard reload (simple + reliable)
    window.location.reload()
  }

  function renderInvestigation() {
    const wrap = el('div', { class: 'phaseContent' })
    wrap.appendChild(el('h3', {}, 'Investigation (Optional Minigames)'))
    wrap.appendChild(el('p', { class: 'muted' }, 'Each completed minigame awards 1 Investigation Point. Points reset after this case.'))

    if (!gameCase.minigames?.length) {
      wrap.appendChild(el('div', { class: 'tip' }, 'No minigames available in this case.'))
      return wrap
    }

    const list = el('div', { class: 'minigameList' })
    for (const m of gameCase.minigames) {
      const done = state.completedMinigames.has(m.id)
      list.appendChild(
        el('div', { class: `minigameCard ${done ? 'done' : ''}` }, [
          el('div', { class: 'minigameHead' }, [
            el('div', { class: 'minigameTitle' }, m.title),
            el('div', { class: 'minigameReward' }, done ? 'Completed' : '+1 Point'),
          ]),
          el('div', { class: 'muted' }, m.description),
          done
            ? el('button', { disabled: true }, 'Completed')
            : el('button', { class: 'primary', onClick: () => openMinigame(m) }, 'Play'),
        ])
      )
    }
    wrap.appendChild(list)
    return wrap
  }

  function openMinigame(m) {
    const modal = el('div', { class: 'modalOverlay', onClick: (e) => { if (e.target === modal) modal.remove() } })
    const card = el('div', { class: 'modalCard' })

    card.appendChild(el('h3', {}, m.title))
    card.appendChild(el('p', { class: 'muted' }, m.description))

    const body = el('div', { class: 'modalBody' })

    if (m.kind === 'ordering') {
      const current = shuffle(m.items)
      const list = el('ol', { class: 'orderList' }, current.map((it) => el('li', { dataset: { id: it.id } }, it.text)))
      body.appendChild(el('p', { class: 'muted' }, 'Tap items to move them up.'))
      list.addEventListener('click', (e) => {
        const li = e.target.closest('li')
        if (!li) return
        const prev = li.previousElementSibling
        if (prev) li.parentElement.insertBefore(li, prev)
      })
      body.appendChild(list)

      const check = el('button', {
        class: 'primary',
        onClick: () => {
          const ids = [...list.querySelectorAll('li')].map((li) => li.dataset.id)
          if (JSON.stringify(ids) === JSON.stringify(m.solution)) {
            completeMinigame(m.id)
            modal.remove()
            render()
          } else {
            state.lastFeedback = 'Not quite. Try rearranging the order.'
            render()
          }
        },
      }, 'Check')
      body.appendChild(check)
    } else if (m.kind === 'matching') {
      const shuffledRights = shuffle(m.pairs.map((p) => p.right))
      const selections = new Map()

      const rows = el('div', { class: 'matchRows' })
      for (const p of m.pairs) {
        const select = el('select', {
          onChange: (e) => selections.set(p.left, e.target.value),
        }, [
          el('option', { value: '' }, 'Select…'),
          ...shuffledRights.map((r) => el('option', { value: r }, r)),
        ])

        rows.appendChild(el('div', { class: 'matchRow' }, [
          el('div', { class: 'matchLeft' }, p.left),
          select,
        ]))
      }
      body.appendChild(rows)

      body.appendChild(
        el('button', {
          class: 'primary',
          onClick: () => {
            const ok = m.pairs.every((p) => selections.get(p.left) === p.right)
            if (ok) {
              completeMinigame(m.id)
              modal.remove()
              render()
            } else {
              state.lastFeedback = 'Some matches are off. Try again.'
              render()
            }
          },
        }, 'Check')
      )
    } else if (m.kind === 'singleChoice') {
      const choices = el('div', { class: 'choiceList' })
      m.options.forEach((opt, idx) => {
        choices.appendChild(
          el('button', {
            class: 'choiceBtn',
            onClick: () => {
              if (idx === m.answerIndex) {
                completeMinigame(m.id)
                modal.remove()
                render()
              } else {
                state.lastFeedback = 'That’s not the strongest lead. Try again.'
                render()
              }
            },
          }, opt)
        )
      })
      body.appendChild(el('p', { class: 'muted' }, m.prompt))
      body.appendChild(choices)
    } else {
      body.appendChild(el('p', {}, 'Minigame placeholder.'))
    }

    card.appendChild(body)
    card.appendChild(el('button', { class: 'ghost', onClick: () => modal.remove() }, 'Close'))
    modal.appendChild(card)
    document.body.appendChild(modal)
  }

  function renderInterviews() {
    const suspect = gameCase.suspects.find((s) => s.id === state.currentSuspectId) || gameCase.suspects[0]
    if (!suspect) return el('div', {}, 'No suspects.')

    const wrap = el('div', { class: 'phaseContent' })
    wrap.appendChild(el('h3', {}, 'Interviews (Mandatory)'))
    wrap.appendChild(el('p', { class: 'muted' }, 'Interview all suspects before you can accuse anyone. Tap a suspect portrait on the right to switch.'))

    wrap.appendChild(el('div', { class: 'interviewHeader' }, [
      el('div', { class: 'bigName' }, suspect.name),
      el('div', { class: 'muted' }, `${suspect.role} • ${suspect.trait}`),
    ]))

    const list = el('div', { class: 'statementList' })
    for (const st of suspect.statements) {
      list.appendChild(
        el(
          'button',
          {
            class: 'statement',
            onClick: () => {
              // Mark interview progress on interaction
              state.interviewed.add(suspect.id)

              if (state.activeToolId) {
                useToolOnStatement(state.activeToolId, suspect.id, st)
              } else {
                addClue(`${suspect.name}: “${st.text}”`)
                state.lastFeedback = 'Statement noted.'
              }
              render()
            },
          },
          [
            el('div', { class: 'statementText' }, `“${st.text}”`),
            el('div', { class: 'statementHint muted' }, state.activeToolId ? 'Tap to use tool on this statement' : 'Tap to log as a clue'),
          ]
        )
      )
    }
    wrap.appendChild(list)

    const status = el('div', { class: 'tip' },
      `Interview progress: ${state.interviewed.size}/${gameCase.suspects.length} suspects interviewed.`
    )
    wrap.appendChild(status)

    return wrap
  }

  function renderAccusation() {
    const wrap = el('div', { class: 'phaseContent' })
    wrap.appendChild(el('h3', {}, 'Accusation'))

    if (!canAccuse()) {
      wrap.appendChild(el('div', { class: 'tip warn' }, 'You must interview all suspects before accusing.'))
      return wrap
    }

    wrap.appendChild(el('p', {}, 'Choose one suspect to accuse. If you are wrong, you can retry or accept a penalty.'))

    const list = el('div', { class: 'accuseList' })
    for (const s of gameCase.suspects) {
      list.appendChild(
        el('button', {
          class: 'accuseChoice',
          onClick: () => {
            const correct = s.id === gameCase.culpritId
            if (correct) {
              addClue(`Accusation: ${s.name} (correct).`)
              state.lastFeedback = 'Correct.'
              setPhase('resolution')
            } else {
              addClue(`Accusation: ${s.name} (incorrect).`)
              state.lastFeedback = 'Incorrect accusation.'
              render()
              // Provide feedback and retry options (no permanent game over).
              const modal = el('div', { class: 'modalOverlay', onClick: (e) => { if (e.target === modal) modal.remove() } })
              const card = el('div', { class: 'modalCard' }, [
                el('h3', {}, 'Incorrect'),
                el('p', {}, 'That suspect does not fit all the logic. You may retry or accept a penalty (no permanent game over).'),
                el('div', { class: 'modalBody' }, [
                  el('button', { class: 'primary', onClick: () => { modal.remove(); resetCaseProgressForRetry() } }, 'Retry'),
                  el('button', { class: 'ghost', onClick: () => { modal.remove(); addClue('Penalty accepted (no permanent loss).'); resetCaseProgressForRetry() } }, 'Accept Penalty'),
                ]),
              ])
              modal.appendChild(card)
              document.body.appendChild(modal)
            }
          },
        }, [
          el('div', { class: 'portrait small' }, s.portraitLabel),
          el('div', {}, s.name),
        ])
      )
    }
    wrap.appendChild(list)
    return wrap
  }

  function render() {
    app.innerHTML = ''

    const shell = el('div', { class: 'shell' })
    shell.appendChild(renderHeader())

    const main = el('main', { class: 'main' }, [renderLeftPanel(), renderRightPanel()])
    shell.appendChild(main)
    shell.appendChild(renderBottomBar())

    // Portrait mode is supported.

    app.appendChild(shell)
  }

  // initial render
  render()
}
