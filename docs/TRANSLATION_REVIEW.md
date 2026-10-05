# Translation review

Every interface string, in English, Traditional Chinese (繁體中文, written to read naturally in Hong Kong) and
Simplified Chinese (简体中文). **Questions, answer options and handbook explanations are not translated.** They stay in
English on purpose, because the real test is taken in English.

352 messages. Plural forms: English has singular and plural (shown on two lines); Chinese has one form.

## How to review

- Read the Chinese columns against the English. Flag anything that is wrong, awkward, too literal or too formal.
- Keep `{placeholders}` such as `{n}` or `{when}` exactly as they are: the app fills them in.
- Send corrections as "key → better wording" (for example `home.quick → 快速練習`). The key is in the first column.

## Terms to confirm

| Concept | 繁體中文 | 简体中文 | Note |
|---|---|---|---|
| Life in the UK test | 英國生活考試 | 英国生活测试 | Traditional uses 考試, Simplified uses 测试 (the usual wording in each region) |
| mock test | 模擬考試 | 模拟考试 |  |
| the real test | 正式考試 | 正式考试 |  |
| handbook (the official book) | 官方手冊 | 官方手册 |  |
| explanation | 解釋 | 解析 | Simplified 解析 is the usual study-guide word |
| spaced repetition | 間隔複習 | 间隔复习 |  |
| Exam 5 (one of the 18 mock papers) | 試卷 5 | 试卷 5 | To avoid confusion with the real "考試" |
| Home (page) | 主頁 | 首页 |  |
| Mastered / Learning / Missed / Not seen | 已掌握 / 學習中 / 答錯 / 未做過 | 已掌握 / 学习中 / 答错 / 未做过 |  |
| Save / Saved (bookmark a question) | 收藏 / 已收藏 | 收藏 / 已收藏 |  |
| Looks wrong? (report an answer) | 答案有誤？ | 答案有误？ |  |
| Import / Replace / Restore | 匯入 / 取代 / 還原 | 导入 / 替换 / 还原 | Hong Kong and Taiwan say 匯入; mainland says 导入 |
| Privacy | 私隱 | 隐私 | 私隱 is the Hong Kong spelling; Taiwan writes 隱私 |
| Buy me a coffee | 請我喝杯咖啡 | 请我喝杯咖啡 |  |
| Home Office | 英國內政部 | 英国内政部 |  |

## App shell

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `app.brand` | Life in the UK | 英國生活考試 | 英国生活测试 |
| `app.title` | Life in the UK Practice | 英國生活考試練習 | 英国生活测试练习 |
| `common.confirm` | Confirm | 確認 | 确认 |
| `common.cancel` | Cancel | 取消 | 取消 |
| `common.dismiss` | Dismiss | 關閉 | 关闭 |
| `dialog.typeToConfirm` | Type {word} to confirm | 輸入「{word}」以確認 | 输入“{word}”以确认 |
| `error.title` | Something went wrong | 出現問題 | 出错了 |
| `error.back` | Back to Home | 返回主頁 | 返回首页 |
| `error.loadTitle` | Could not load the questions | 無法載入題目 | 无法加载题目 |
| `error.loadHint` | Check your connection and reload. | 請檢查網絡連線後重新載入。 | 请检查网络连接后重新加载。 |
| `error.loadQuestions` | Could not load questions ({status}) | 無法載入題目（{status}） | 无法加载题目（{status}） |
| `update.ready` | A new version is ready. | 有新版本可用。 | 有新版本可用。 |
| `update.reload` | Reload | 重新載入 | 重新加载 |
| `lang.auto` | Auto | 自動 | 自动 |

## Navigation

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `nav.aria` | Main | 主選單 | 主菜单 |
| `nav.home` | Home | 主頁 | 首页 |
| `nav.practice` | Practice | 練習 | 练习 |
| `nav.stats` | Stats | 統計 | 统计 |
| `nav.questions` | Questions | 題庫 | 题库 |
| `nav.settings` | Settings | 設定 | 设置 |
| `nav.session` | Session | 練習中 | 练习中 |
| `nav.results` | Results | 結果 | 结果 |
| `countdown.testDay` | Test day | 考試當天 | 考试当天 |
| `countdown.days` | {n}d to test | 距考試 {n} 天 | 距考试 {n} 天 |

## Time words

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `time.never` | never | 從未 | 从未 |
| `time.justNow` | just now | 剛剛 | 刚刚 |
| `time.minAgo` | {n} min ago | {n} 分鐘前 | {n} 分钟前 |
| `time.hrAgo` | {n} hr ago | {n} 小時前 | {n} 小时前 |
| `time.daysAgo` | {n} day ago<br>{n} days ago | {n} 天前 | {n} 天前 |

## Question and session words

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `kind.today` | Today's session | 今日練習 | 今日练习 |
| `kind.new` | New questions | 新題目 | 新题目 |
| `kind.first` | First steps | 入門練習 | 入门练习 |
| `kind.due` | Review | 複習 | 复习 |
| `kind.weak` | Weak spots | 薄弱題目 | 薄弱题目 |
| `kind.mostMissed` | Most missed | 最常答錯 | 最常答错 |
| `kind.saved` | Saved questions | 已收藏題目 | 已收藏题目 |
| `kind.random` | Random mix | 隨機混合 | 随机混合 |
| `kind.marathon` | Marathon | 馬拉松練習 | 马拉松练习 |
| `kind.retry` | Retry missed | 重做答錯題目 | 重做答错题目 |
| `kind.mock` | Mock test | 模擬考試 | 模拟考试 |
| `kind.exam` | Exam {n} | 試卷 {n} | 试卷 {n} |
| `q.number` | Q{n} | 第 {n} 題 | 第 {n} 题 |
| `q.save` | Save | 收藏 | 收藏 |
| `q.saved` | Saved | 已收藏 | 已收藏 |
| `q.looksWrong` | Looks wrong? | 答案有誤？ | 答案有误？ |
| `q.reported` | Reported | 已回報 | 已反馈 |
| `q.noExplanation` | No explanation is provided for this question in the source. | 資料來源沒有提供此題的解釋。 | 数据来源没有提供此题的解析。 |
| `q.sinceHandbook` | Since the handbook: | 手冊出版後的變動： | 手册出版后的变化： |
| `status.mastered` | Mastered | 已掌握 | 已掌握 |
| `status.learning` | Learning | 學習中 | 学习中 |
| `status.missedLast` | Missed last time | 上次答錯 | 上次答错 |
| `status.missed` | Missed | 答錯 | 答错 |
| `status.notSeen` | Not seen | 未做過 | 未做过 |
| `legend.mastered` | Right 3 times in a row | 連續答對 3 次 | 连续答对 3 次 |
| `legend.learning` | Right last time | 上次答對 | 上次答对 |
| `legend.missed` | Wrong last time | 上次答錯 | 上次答错 |
| `legend.notSeen` | Not attempted yet | 尚未作答 | 尚未作答 |
| `verdict.ready` | Ready to book | 可以預約考試 | 可以预约考试 |
| `verdict.close` | Getting close | 接近目標 | 接近目标 |
| `verdict.building` | Still building | 仍在進步中 | 仍在进步中 |
| `count.reviews` | {n} review<br>{n} reviews | {n} 題複習 | {n} 道复习题 |
| `count.newQuestions` | {n} new question<br>{n} new questions | {n} 題新題目 | {n} 道新题 |

## Home

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `home.today` | Today | 今日 | 今日 |
| `home.testDay` | Test day | 考試當天 | 考试当天 |
| `home.daysToTest` | {n} day to your test<br>{n} days to your test | 距離考試還有 {n} 天 | 距离考试还有 {n} 天 |
| `home.goalReached` | Daily goal reached | 已達成每日目標 | 已完成每日目标 |
| `home.answeredToday` | {done}/{goal} answered today | 今日已答 {done}/{goal} 題 | 今日已答 {done}/{goal} 题 |
| `home.streakTitle` | Consecutive days practised | 連續練習日數 | 连续练习天数 |
| `home.plan` | Today's session: {reviews} + {fresh} | 今日練習：{reviews} + {fresh} | 今日练习：{reviews} + {fresh} |
| `home.planExtra` |  + {n} more to practise |  + {n} 題加強練習 |  + {n} 道加强练习 |
| `home.nothingDue` | Nothing due — pick a topic below. | 暫時沒有需要複習的題目，請在下方選擇練習項目。 | 暂时没有需要复习的题目，请在下方选择练习项目。 |
| `home.keepGoing` | Keep going | 繼續練習 | 继续练习 |
| `home.startToday` | Start today's session | 開始今日練習 | 开始今日练习 |
| `home.readiness` | Test readiness | 考試準備度 | 考试准备度 |
| `home.readinessEstimate` | Estimated score on a real test (pass mark {pass}), from how well you know the questions you've seen and how many you haven't yet. | 根據你對已做題目的掌握程度，以及尚未做過的題目數量，估算在正式考試中的得分（及格分數 {pass}）。 | 根据你对已做题目的掌握程度，以及尚未做过的题目数量，估算在正式考试中的得分（及格分数 {pass}）。 |
| `home.readinessNeedMore` | Answer 20 questions to get an estimated test score. | 完成 20 題後即可顯示估算得分。 | 完成 20 题后即可显示估算得分。 |
| `home.quick` | Quick practice | 快速練習 | 快速练习 |
| `home.allOptions` | All options | 所有選項 | 所有选项 |
| `home.banner.lastBackup` | Last backup {when}. Back up your progress. | 上次備份：{when}。請備份你的進度。 | 上次备份：{when}。请备份你的进度。 |
| `home.banner.noBackup` | No backup yet. Back up your progress so it can never be lost. | 尚未備份。請備份進度，避免遺失。 | 尚未备份。请备份进度，避免丢失。 |
| `home.banner.resume` | Resume {label}: {done}/{total} done | 繼續{label}：已完成 {done}/{total} | 继续{label}：已完成 {done}/{total} |
| `home.mock.title` | Mock test | 模擬考試 | 模拟考试 |
| `home.mock.desc` | {q} questions · {m} minutes · pass at {pass}. No feedback until the end. | {q} 題 · {m} 分鐘 · 答對 {pass} 題及格。完成後才顯示答案。 | {q} 题 · {m} 分钟 · 答对 {pass} 题及格。完成后才显示答案。 |
| `home.mock.last` | Last: {c}/{t} — {result} | 上次：{c}/{t} — {result} | 上次：{c}/{t} — {result} |
| `home.mock.passed` | passed | 已及格 | 已及格 |
| `home.mock.notYet` | not yet | 尚未及格 | 尚未及格 |
| `home.mock.notYetTitle` | Not yet | 尚未及格 | 尚未及格 |
| `home.mock.take` | Take a mock | 進行模擬考試 | 进行模拟考试 |
| `tile.due` | Due for review | 待複習 | 待复习 |
| `tile.dueSub` | Spaced repetition | 間隔複習 | 间隔复习 |
| `tile.weak` | Weak spots | 薄弱題目 | 薄弱题目 |
| `tile.weakSub` | Missed or under 60% | 答錯或正確率低於 60% | 答错或正确率低于 60% |
| `tile.new` | New questions | 新題目 | 新题目 |
| `tile.newSub` | Not seen yet | 尚未做過 | 尚未做过 |
| `tile.saved` | Saved | 已收藏 | 已收藏 |
| `tile.savedSub` | Starred questions | 已加星號的題目 | 已加星标的题目 |

## Practice menu

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `practice.lengthAria` | Session length | 每節題數 | 每次题数 |
| `practice.all` | All | 全部 | 全部 |
| `practice.practise` | Practise | 練習 | 练习 |
| `practice.questions` | Questions | 題數 | 题数 |
| `practice.originalExams` | Original exams | 試卷練習 | 试卷练习 |
| `practice.fixedSets` | Fixed sets, shuffled | 固定題組，順序隨機 | 固定题组，顺序随机 |
| `practice.marathon` | Marathon — all {n} questions | 馬拉松練習 — 全部 {n} 題 | 马拉松练习 — 全部 {n} 题 |
| `practice.startMock` | Start mock test | 開始模擬考試 | 开始模拟考试 |
| `practice.examAria` | Exam {n}: {seen} of {total} seen, {mastered} mastered | 試卷 {n}：已做 {seen}/{total} 題，已掌握 {mastered} 題 | 试卷 {n}：已做 {seen}/{total} 题，已掌握 {mastered} 题 |
| `practice.examSeen` | {seen}/{total} seen | 已做 {seen}/{total} 題 | 已做 {seen}/{total} 题 |
| `practice.rule.random` | {n} random questions | {n} 題隨機題目 | {n} 道随机题目 |
| `practice.rule.minutes` | {n} minutes, auto-submits at zero | {n} 分鐘，時間到自動交卷 | {n} 分钟，时间到自动交卷 |
| `practice.rule.pass` | Pass mark {pass}/{total} (75%) | 及格分數 {pass}/{total}（75%） | 及格分数 {pass}/{total}（75%） |
| `practice.rule.noAnswers` | No answers shown until you finish | 完成後才顯示答案 | 完成后才显示答案 |
| `row.dueSub` | Questions the spaced-repetition schedule says to revisit | 間隔複習計劃安排你再次練習的題目 | 间隔复习计划安排你再次练习的题目 |
| `row.weakSub` | Missed last time or under 60% accuracy | 上次答錯，或正確率低於 60% | 上次答错，或正确率低于 60% |
| `row.newSub` | Never attempted | 從未作答 | 从未作答 |
| `row.savedSub` | Your starred questions | 你加了星號的題目 | 你加了星标的题目 |
| `row.randomSub` | A random draw from every question | 從所有題目中隨機抽取 | 从所有题目中随机抽取 |

## During a session

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `sess.discard.title` | Discard your mock test? | 放棄模擬考試？ | 放弃模拟考试？ |
| `sess.discard.body` | You have a mock test in progress ({done} of {total} answered). Starting something new discards it without scoring. | 你有一份進行中的模擬考試（已答 {done}/{total} 題）。開始新的練習會放棄該考試，且不會計分。 | 你有一场进行中的模拟考试（已答 {done}/{total} 题）。开始新的练习会放弃该考试，且不会计分。 |
| `sess.discard.confirm` | Discard and start | 放棄並開始 | 放弃并开始 |
| `sess.discard.cancel` | Resume the mock | 繼續模擬考試 | 继续模拟考试 |
| `sess.expiredAway` | The time ran out while you were away, so your test was marked. | 你離開期間時間已到，系統已為你的考試評分。 | 你离开期间时间已到，系统已为你的考试评分。 |
| `sess.timeRemaining` | Time remaining | 剩餘時間 | 剩余时间 |
| `sess.finishTest` | Finish test | 完成考試 | 完成考试 |
| `sess.endSession` | End session | 結束練習 | 结束练习 |
| `sess.finish` | Finish | 完成 | 完成 |
| `sess.end` | End | 結束 | 结束 |
| `sess.questionOf` | Question {n} of {total} | 第 {n} 題，共 {total} 題 | 第 {n} 题，共 {total} 题 |
| `sess.progress` | Progress | 進度 | 进度 |
| `sess.selectN` | Select {n} answers | 請選擇 {n} 個答案 | 请选择 {n} 个答案 |
| `sess.selectOne` | Select 1 answer | 請選擇 1 個答案 | 请选择 1 个答案 |
| `sess.selectMore` | Select {n} more | 還需選擇 {n} 個 | 还需选择 {n} 个 |
| `sess.selectExactly` | Select exactly {n} — tap one to deselect first. | 須剛好選擇 {n} 個 — 請先取消其中一個。 | 必须正好选择 {n} 个 — 请先取消其中一个。 |
| `sess.status.correct` | , correct | ，答對 | ，答对 |
| `sess.status.theCorrect` | , the correct answer | ，正確答案 | ，正确答案 |
| `sess.status.incorrect` | , incorrect | ，答錯 | ，答错 |
| `sess.correctAnswer` | Correct answer | 正確答案 | 正确答案 |
| `sess.flag` | Flag for later | 稍後檢查 | 稍后检查 |
| `sess.flagged` | Flagged | 已標記 | 已标记 |
| `sess.reportTitle` | Mark this question or its answer as looking wrong | 標記此題或答案似乎有誤 | 标记此题或答案似乎有误 |
| `sess.reportedToast` | Marked as possibly wrong. Find it under Questions → Reported. | 已標記為可能有誤。可在「題庫」→「已回報」查看。 | 已标记为可能有误。可在“题库”→“已反馈”中查看。 |
| `sess.reportRemoved` | Report removed. | 已取消回報。 | 已取消反馈。 |
| `sess.questionAria` | Question | 題目 | 题目 |
| `sess.correct` | Correct | 答對了 | 答对了 |
| `sess.notQuite` | Not quite | 答錯了 | 答错了 |
| `sess.correctColon` | Correct: | 正確答案： | 正确答案： |
| `sess.back` | Back | 上一題 | 上一题 |
| `sess.next` | Next | 下一題 | 下一题 |
| `sess.check` | Check answer | 核對答案 | 核对答案 |
| `sess.seeResults` | See results | 查看結果 | 查看结果 |
| `sess.nextQuestion` | Next question | 下一題 | 下一题 |
| `sess.navigatorAria` | Question navigator, {done} of {total} answered | 題目導覽，已答 {done}/{total} 題 | 题目导航，已答 {done}/{total} 题 |
| `sess.announce.correct` | Correct. | 答對了。 | 答对了。 |
| `sess.announce.wrong` | Not quite. Correct answer: {answer}. | 答錯了。正確答案：{answer}。 | 答错了。正确答案：{answer}。 |
| `sess.leave.title` | Leave this session? | 離開此練習？ | 离开此练习？ |
| `sess.leave.body` | You have not answered anything yet. | 你還沒有作答任何題目。 | 你还没有作答任何题目。 |
| `sess.leave.confirm` | Leave | 離開 | 离开 |
| `sess.leave.cancel` | Stay | 留下 | 留下 |
| `sess.end.title` | End session? | 結束練習？ | 结束练习？ |
| `sess.end.body` | {n} answer is already saved. The remaining questions stay unanswered.<br>{n} answers are already saved. The remaining questions stay unanswered. | 已儲存 {n} 個答案，其餘題目保持未作答。 | 已保存 {n} 个答案，其余题目保持未作答。 |
| `sess.end.confirm` | End and see results | 結束並查看結果 | 结束并查看结果 |
| `sess.end.cancel` | Keep going | 繼續練習 | 继续练习 |
| `sess.nav.title` | Questions | 題目 | 题目 |
| `sess.nav.cell` | Question {n} | 第 {n} 題 | 第 {n} 题 |
| `sess.nav.answered` | , answered | ，已作答 | ，已作答 |
| `sess.nav.partly` | , partly answered | ，部分作答 | ，部分作答 |
| `sess.nav.notAnswered` | , not answered | ，未作答 | ，未作答 |
| `sess.nav.flagged` | , flagged | ，已標記 | ，已标记 |
| `sess.nav.legendAnswered` | Answered | 已作答 | 已作答 |
| `sess.nav.legendFlagged` | Flagged | 已標記 | 已标记 |
| `sess.nav.legendUnanswered` | Unanswered | 未作答 | 未作答 |
| `sess.nav.close` | Close | 關閉 | 关闭 |
| `sess.finish.title` | Finish the test? | 完成考試？ | 完成考试？ |
| `sess.finish.unanswered` | {n} unanswered or incomplete question will count as wrong<br>{n} unanswered or incomplete questions will count as wrong | {n} 題未作答或未完成，將計為答錯 | {n} 题未作答或未完成，将计为答错 |
| `sess.finish.flagged` | {n} flagged | {n} 題已標記 | {n} 题已标记 |
| `sess.finish.sep` | ;  | ； | ； |
| `sess.finish.stop` | .  | 。 | 。 |
| `sess.finish.cannotChange` | You cannot change answers after finishing. | 完成後不能再修改答案。 | 完成后不能再修改答案。 |
| `sess.finish.confirm` | Finish and mark | 完成並評分 | 完成并评分 |
| `sess.finish.cancel` | Keep working | 繼續作答 | 继续作答 |
| `sess.timeUp` | Time's up — marking your test. | 時間到 — 正在為你的考試評分。 | 时间到 — 正在为你的考试评分。 |

## Results

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `res.sr.correct` | Correct:  | 答對： | 答对： |
| `res.sr.incorrect` | Incorrect:  | 答錯： | 答错： |
| `res.sr.unanswered` | Unanswered:  | 未作答： | 未作答： |
| `res.notAnswered` | You did not answer this question. | 你沒有回答此題。 | 你没有回答此题。 |
| `res.yourAnswer` | Your answer: | 你的答案： | 你的答案： |
| `res.showMissed` | Show only missed ({n}) | 只顯示答錯（{n}） | 只显示答错（{n}） |
| `res.showAll` | Show all ({n}) | 顯示全部（{n}） | 显示全部（{n}） |
| `res.nothingMissed` | Nothing missed — every answer was right. | 沒有答錯 — 全部答對！ | 没有答错 — 全部答对！ |
| `res.passMark` | {c}/{t} — pass mark is {pass}/{total} (75%) | {c}/{t} — 及格分數為 {pass}/{total}（75%） | {c}/{t} — 及格分数为 {pass}/{total}（75%） |
| `res.timeRanOut` |  · time ran out |  · 時間已到 |  · 时间已到 |
| `res.percentCorrect` | {p}% correct · {label} | 正確率 {p}% · {label} | 正确率 {p}% · {label} |
| `res.retry` | Retry {n} missed | 重做 {n} 題答錯題目 | 重做 {n} 道答错题目 |
| `res.counts` | {right} right · {wrong} wrong | 答對 {right} 題 · 答錯 {wrong} 題 | 答对 {right} 题 · 答错 {wrong} 题 |
| `res.countsUnanswered` |  · {n} unanswered |  · 未作答 {n} 題 |  · 未作答 {n} 题 |
| `res.removed` | {n} question from this session is no longer in the question bank and can't be shown.<br>{n} questions from this session are no longer in the question bank and can't be shown. | 此練習中有 {n} 題已不在題庫內，無法顯示。 | 此练习中有 {n} 道题已不在题库内，无法显示。 |
| `res.practiseMore` | Practise more | 繼續練習 | 继续练习 |
| `res.review` | Review | 回顧 | 回顾 |

## Stats

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `stats.empty.title` | No data yet | 暫無資料 | 暂无数据 |
| `stats.empty.body` | Answer a few questions and your accuracy, coverage and history will appear here. | 回答幾題後，你的正確率、完成進度和歷史紀錄便會顯示在這裡。 | 回答几道题后，你的正确率、完成进度和历史记录就会显示在这里。 |
| `stats.empty.cta` | Start practising | 開始練習 | 开始练习 |
| `stats.tile.answers` | Answers given | 已作答題數 | 已作答题数 |
| `stats.tile.accuracy` | Overall accuracy | 整體正確率 | 整体正确率 |
| `stats.tile.seen` | Questions seen | 已做題目 | 已做题目 |
| `stats.tile.mocks` | Mocks passed | 已及格的模擬考試 | 已及格的模拟考试 |
| `stats.trend.title` | Accuracy by session | 各次練習正確率 | 各次练习正确率 |
| `stats.trend.more` | Complete two or more sessions to see a trend. | 完成兩次或以上練習後，便可看到趨勢。 | 完成两次或以上练习后，才能看到趋势。 |
| `stats.trend.aria` | Accuracy over your last {n} sessions | 最近 {n} 次練習的正確率 | 最近 {n} 次练习的正确率 |
| `stats.trend.pass` | pass 75% | 及格線 75% | 及格线 75% |
| `stats.trend.point` | {date}: {p}% | {date}：{p}% | {date}：{p}% |
| `stats.trend.pointMock` | {date}: {p}% (mock) | {date}：{p}%（模擬考試） | {date}：{p}%（模拟考试） |
| `stats.trend.note` | Larger dots are mock tests. | 較大的圓點代表模擬考試。 | 较大的圆点代表模拟考试。 |
| `stats.activity` | Activity | 練習紀錄 | 练习记录 |
| `stats.daysPracticed` | {n} day practised<br>{n} days practised | 已練習 {n} 天 | 已练习 {n} 天 |
| `stats.heat.aria` | Answers per day over the last 10 weeks | 過去 10 週每日作答題數 | 过去 10 周每日作答题数 |
| `stats.heat.answers` | {n} answer<br>{n} answers | {n} 題 | {n} 题 |
| `stats.byExam` | Progress by exam | 各試卷進度 | 各试卷进度 |
| `stats.practiseExamAria` | Practise exam {n} | 練習試卷 {n} | 练习试卷 {n} |
| `stats.pass` | Pass | 及格 | 及格 |
| `stats.fail` | Fail | 不及格 | 不及格 |
| `stats.mostMissed` | Most missed | 最常答錯 | 最常答错 |
| `stats.practiseThese` | Practise these | 練習這些題目 | 练习这些题目 |

## Questions browser

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `browse.all` | All | 全部 | 全部 |
| `browse.notes` | Notes | 筆記 | 笔记 |
| `browse.searchPlaceholder` | Search questions and answers (English) | 搜尋題目和答案（英文） | 搜索题目和答案（英文） |
| `browse.searchAria` | Search questions | 搜尋題目 | 搜索题目 |
| `browse.examFilterAria` | Filter by exam | 按試卷篩選 | 按试卷筛选 |
| `browse.allExams` | All exams | 所有試卷 | 所有试卷 |
| `browse.statusFilterAria` | Filter by status | 按狀態篩選 | 按状态筛选 |
| `browse.count` | {n} question<br>{n} questions | {n} 題 | {n} 题 |
| `browse.showMore` | Show {n} more | 再顯示 {n} 題 | 再显示 {n} 题 |
| `browse.noMatch` | No questions match. | 沒有符合的題目。 | 没有符合条件的题目。 |
| `browse.notePlaceholder` | Add a note or memory trick… | 新增筆記或記憶技巧… | 添加笔记或记忆技巧… |
| `browse.noteAria` | Note | 筆記 | 笔记 |
| `browse.noteSaved` | Note saved | 筆記已儲存 | 笔记已保存 |
| `browse.hist` | {status} · answered {n}× ({right} right, {wrong} wrong) | {status} · 已作答 {n} 次（答對 {right} 次，答錯 {wrong} 次） | {status} · 已作答 {n} 次（答对 {right} 次，答错 {wrong} 次） |
| `browse.notAttempted` | Not attempted yet | 尚未作答 | 尚未作答 |

## Welcome screen

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `welcome.eyebrow` | Free practice for the Life in the UK test | 英國生活考試免費練習 | 英国生活测试免费练习 |
| `welcome.title` | Practise smarter, not longer | 事半功倍的練習方法 | 事半功倍的练习方法 |
| `welcome.intro` | {n} questions from 18 mock exams, each with an explanation from the handbook. The app remembers every answer and brings back the ones you get wrong, at the right time. | 收錄 18 套模擬試卷共 {n} 題，每題附有手冊解釋。應用程式會記住你的每個答案，並在適當的時候讓你重溫答錯的題目。 | 收录 18 套模拟试卷共 {n} 题，每题附有手册解析。应用会记住你的每个答案，并在合适的时候让你重温答错的题目。 |
| `welcome.start` | Start with 10 questions | 先做 10 題 | 先做 10 题 |
| `welcome.dashboard` | Go to my dashboard | 前往我的主頁 | 前往我的首页 |
| `welcome.restore` | Restore a backup | 還原備份 | 还原备份 |
| `welcome.how` | How it works | 運作方式 | 运作方式 |
| `welcome.step1.title` | Practise with feedback | 即時回饋的練習 | 即时反馈的练习 |
| `welcome.step1.body` | Answer and see straight away whether you were right, with the reason from the handbook. | 作答後立刻知道對錯，並附上手冊中的原因。 | 作答后立刻知道对错，并附上手册中的原因。 |
| `welcome.step2.title` | Review at the right time | 適時複習 | 适时复习 |
| `welcome.step2.body` | Wrong answers come back immediately. Right ones return after a few days, until you know them. | 答錯的題目會馬上再出現；答對的題目隔幾天後再複習，直到你熟悉為止。 | 答错的题目会马上再出现；答对的题目隔几天后再复习，直到你熟练为止。 |
| `welcome.step3.title` | Test yourself | 測試自己 | 测试自己 |
| `welcome.step3.body` | Take a timed mock test, like the real one, when you feel ready. | 準備好後，進行與正式考試相同的限時模擬考試。 | 准备好后，进行与正式考试相同的限时模拟考试。 |
| `welcome.realTest` | The real test | 正式考試 | 正式考试 |
| `welcome.fact.questions` | questions | 題 | 题 |
| `welcome.fact.minutes` | minutes | 分鐘 | 分钟 |
| `welcome.fact.toPass` | to pass (75%) | 題及格（75%） | 题及格（75%） |
| `welcome.testDesc` | Multiple choice, on a computer. Some questions ask you to choose two answers. Booked through GOV.UK. | 選擇題，在電腦上作答，部分題目要求選擇兩個答案。透過 GOV.UK 預約。 | 选择题，在电脑上作答，部分题目要求选择两个答案。通过 GOV.UK 预约。 |
| `welcome.when` | When is your test? | 你的考試日期是？ | 你的考试日期是？ |
| `welcome.date.optional` | Optional. With a date, reviews are scheduled so you see every question again before the day. | 選填。填寫日期後，系統會安排複習，讓你在考試前再次接觸每一道題。 | 选填。填写日期后，系统会安排复习，让你在考试前再次接触每一道题。 |
| `welcome.date.today` | Your test is today. Good luck! | 你今天考試。祝你好運！ | 你今天考试。祝你好运！ |
| `welcome.date.daysToGo` | {n} day to go. Reviews will be scheduled to fit.<br>{n} days to go. Reviews will be scheduled to fit. | 還有 {n} 天。系統會相應安排複習。 | 还有 {n} 天。系统会相应安排复习。 |
| `welcome.private.title` | Private. | 私隱。 | 隐私。 |
| `welcome.private.body` | No account needed. Your progress stays in this browser and is never sent anywhere. | 無需帳戶。你的進度只儲存在此瀏覽器，不會傳送到任何地方。 | 无需账户。你的进度只保存在此浏览器中，不会发送到任何地方。 |
| `welcome.install.title` | Install. | 安裝。 | 安装。 |
| `welcome.install.ios` | To keep it like an app, tap Share → Add to Home Screen. Do this before you start, because the installed app keeps its own progress. | 想像應用程式一樣使用：點按「分享」→「加入主畫面」。請在開始練習前安裝，因為已安裝的應用程式會另外儲存進度。 | 想像应用一样使用：点按“分享”→“添加到主屏幕”。请在开始练习前安装，因为已安装的应用会单独保存进度。 |
| `welcome.install.android` | To keep it like an app, open your browser menu and choose Install app. | 想像應用程式一樣使用：開啟瀏覽器選單，選擇「安裝應用程式」。 | 想像应用一样使用：打开浏览器菜单，选择“安装应用”。 |
| `welcome.install.desktop` | To keep it like an app, use the install icon in your browser's address bar (Chrome, Edge) or File → Add to Dock (Safari). | 想像應用程式一樣使用：點按瀏覽器網址列的安裝圖示（Chrome、Edge），或在 Safari 選擇「檔案」→「加入 Dock」。 | 想像应用一样使用：点击浏览器地址栏中的安装图标（Chrome、Edge），或在 Safari 中选择“文件”→“添加到程序坞”。 |
| `welcome.unofficial.title` | Unofficial. | 非官方。 | 非官方。 |
| `welcome.unofficial.body` | Not affiliated with the Home Office. The questions come from a community bank and have been checked against the handbook. | 與英國內政部無關。題目來自社群題庫，並已對照官方手冊核對。 | 与英国内政部无关。题目来自社区题库，并已对照官方手册核对。 |
| `welcome.english.title` | In English. | 題目為英文。 | 题目为英文。 |
| `welcome.english.body` | The questions, answers and explanations stay in English, like the real test. Only the app menus are translated. | 題目、選項和解釋保持英文，與正式考試一致；只有應用程式的選單和說明已翻譯。 | 题目、选项和解析保持英文，与正式考试一致；只有应用的菜单和说明已翻译。 |

## Support card

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `support.aria` | Support this app | 支持此應用程式 | 支持此应用 |
| `support.button` | Buy me a coffee | 請我喝杯咖啡 | 请我喝杯咖啡 |
| `support.notNow` | Not now | 暫時不用 | 暂时不用 |
| `support.pass.title` | You passed the mock! 🎉 | 你通過了模擬考試！🎉 | 你通过了模拟考试！🎉 |
| `support.pass.body` | This app is free, ad-free and made by one person. If it helped you get ready, a coffee helps me keep the questions checked and the app improving. | 這個應用程式免費、無廣告，由一個人製作。如果它幫助你做好準備，一杯咖啡能讓我繼續核對題目和改進應用程式。 | 这个应用免费、无广告，由一个人制作。如果它帮助你做好准备，一杯咖啡能让我继续核对题目和改进应用。 |
| `support.good.title` | Strong session. Nice work. | 表現出色，做得好！ | 表现出色，做得好！ |
| `support.good.body` | This app is free, ad-free and made by one person. If it is helping, a coffee helps me keep improving it. | 這個應用程式免費、無廣告，由一個人製作。如果它對你有幫助，一杯咖啡能讓我繼續改進。 | 这个应用免费、无广告，由一个人制作。如果它对你有帮助，一杯咖啡能让我继续改进。 |
| `support.home.title` | Finding it useful? | 覺得有用嗎？ | 觉得有用吗？ |
| `support.home.body` | This app is free and ad-free, and made by one person. If it is helping you prepare, a coffee helps me keep it updated. | 這個應用程式免費、無廣告，由一個人製作。如果它幫助你備考，一杯咖啡能讓我繼續更新。 | 这个应用免费、无广告，由一个人制作。如果它帮助你备考，一杯咖啡能让我继续更新。 |

## Settings

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `st.language` | Language | 語言 | 语言 |
| `st.languageHint` | Changes the app menus and help text. Questions and explanations stay in English, like the real test. | 更改應用程式的選單和說明文字。題目和解釋保持英文，與正式考試一致。 | 更改应用的菜单和说明文字。题目和解析保持英文，与正式考试一致。 |
| `st.study` | Study plan | 學習計劃 | 学习计划 |
| `st.testDate` | Test date | 考試日期 | 考试日期 |
| `st.testDateHint.none` | Add it and reviews are scheduled to land before the day. | 填寫後，系統會安排複習在考試前完成。 | 填写后，系统会安排复习在考试前完成。 |
| `st.testDateHint.days` | {n} day to go — review intervals are shortened to fit.<br>{n} days to go — review intervals are shortened to fit. | 還有 {n} 天 — 複習間隔已縮短以配合。 | 还有 {n} 天 — 复习间隔已缩短以配合。 |
| `st.dailyGoal` | Daily goal | 每日目標 | 每日目标 |
| `st.dailyGoalHint` | Answers per day, shown on Home. Answering anything on a day keeps your streak. | 每日作答題數，顯示在主頁。每天作答任何題目即可保持連續練習。 | 每日作答题数，显示在首页。每天作答任何题目即可保持连续练习。 |
| `st.goalOption` | {n} questions | {n} 題 | {n} 题 |
| `st.practice` | Practice | 練習 | 练习 |
| `st.shuffleQ` | Shuffle question order | 隨機題目順序 | 随机题目顺序 |
| `st.shuffleQHint` | Mock tests are always shuffled. | 模擬考試一律隨機排序。 | 模拟考试一律随机排序。 |
| `st.shuffleO` | Shuffle answer options | 隨機選項順序 | 随机选项顺序 |
| `st.shuffleOHint` | True/False and Yes/No stay in a fixed order. | 「對／錯」和「是／否」選項保持固定順序。 | “对／错”和“是／否”选项保持固定顺序。 |
| `st.theme` | Theme | 主題 | 主题 |
| `theme.auto` | Auto | 自動 | 自动 |
| `theme.light` | Light | 淺色 | 浅色 |
| `theme.dark` | Dark | 深色 | 深色 |
| `st.backup.title` | Back up & move progress | 備份與轉移進度 | 备份与转移进度 |
| `st.backup.last` | Last backup: {when}{changes}. Progress is kept in this browser; a backup file protects it and moves it between phone and laptop. | 上次備份：{when}{changes}。進度儲存在此瀏覽器；備份檔案可保護進度，並在手機和電腦之間轉移。 | 上次备份：{when}{changes}。进度保存在此浏览器中；备份文件可保护进度，并在手机和电脑之间转移。 |
| `st.backup.changes` |  · {n} change since<br> · {n} changes since |  · 之後有 {n} 項更改 |  · 之后有 {n} 项更改 |
| `st.download` | Download backup | 下載備份 | 下载备份 |
| `st.share` | Share / save to Files | 分享／儲存到「檔案」 | 分享／保存到“文件” |
| `st.shareTitle` | Life in the UK progress | 英國生活考試練習進度 | 英国生活测试练习进度 |
| `st.shareFailed` | Sharing failed. Use Download instead. | 分享失敗，請改用下載。 | 分享失败，请改用下载。 |
| `st.exported` | Backup file "{name}" created. Check your Downloads folder (or the Files app) to be sure it saved. | 已建立備份檔案「{name}」。請檢查「下載」資料夾（或「檔案」App）確認已儲存。 | 已创建备份文件“{name}”。请检查“下载”文件夹（或“文件”App）确认已保存。 |
| `st.importMerge` | Import & merge | 匯入並合併 | 导入并合并 |
| `st.importReplace` | Import & replace | 匯入並取代 | 导入并替换 |
| `st.mergeHint` | Merge combines two devices: export on one, merge on the other, then repeat the other way round. | 合併可結合兩部裝置的進度：在一部裝置匯出，在另一部合併，然後反向再做一次。 | 合并可结合两台设备的进度：在一台设备上导出，在另一台上合并，然后反向再做一次。 |
| `st.err.json` | That file is not valid JSON. | 該檔案不是有效的 JSON。 | 该文件不是有效的 JSON。 |
| `st.err.notBackup` | That file is not a progress backup. | 該檔案不是進度備份。 | 该文件不是进度备份。 |
| `st.err.import` | That file could not be imported. Nothing was changed. | 無法匯入該檔案，沒有任何更改。 | 无法导入该文件，没有做任何更改。 |
| `st.replace.title` | Replace all progress? | 取代所有進度？ | 替换所有进度？ |
| `st.replace.body` | This replaces the {now} answers on this device with the {n} in the file. Your current progress is kept under "Previous copies" so you can undo this. Merge is usually what you want. | 這會用檔案中的 {n} 個答案取代此裝置上的 {now} 個答案。你目前的進度會保留在「以往副本」，可隨時還原。通常「合併」才是你需要的。 | 这会用文件中的 {n} 个答案替换此设备上的 {now} 个答案。你当前的进度会保留在“以往副本”中，可随时还原。通常“合并”才是你需要的。 |
| `st.replace.confirm` | Replace | 取代 | 替换 |
| `st.merge.title` | Merge this backup? | 合併此備份？ | 合并此备份？ |
| `st.merge.body` | The file has {n} answers. Anything new is added; nothing on this device is removed. | 檔案中有 {n} 個答案。新的答案會加入；此裝置上的資料不會被移除。 | 文件中有 {n} 个答案。新的答案会被加入；此设备上的数据不会被移除。 |
| `st.merge.confirm` | Merge | 合併 | 合并 |
| `st.prev.title` | Previous copies | 以往副本 | 以往副本 |
| `st.prev.hint` | Saved automatically just before an erase, replace or restore, so those can be undone. | 在清除、取代或還原前自動儲存，以便復原。 | 在清除、替换或还原前自动保存，以便撤销。 |
| `st.prev.line` | {answers} answers · {sessions} sessions | {answers} 個答案 · {sessions} 次練習 | {answers} 个答案 · {sessions} 次练习 |
| `st.reason.erase` | before erase | 清除前 | 清除前 |
| `st.reason.import` | before import | 匯入前 | 导入前 |
| `st.reason.restore` | before restore | 還原前 | 还原前 |
| `st.restore.title` | Restore this copy? | 還原此副本？ | 还原此副本？ |
| `st.restore.body` | Your current progress ({n} answers) is saved as a previous copy first, so you can switch back. | 你目前的進度（{n} 個答案）會先儲存為以往副本，方便你切換回來。 | 你当前的进度（{n} 个答案）会先保存为以往副本，方便你切换回来。 |
| `st.restore.confirm` | Restore | 還原 | 还原 |
| `st.persist.checking` | Checking storage… | 正在檢查儲存空間… | 正在检查存储空间… |
| `st.persist.unsupported` | This browser cannot report storage protection. Keep regular backups. | 此瀏覽器無法報告儲存保護狀態。請定期備份。 | 此浏览器无法报告存储保护状态。请定期备份。 |
| `st.persist.protected` | Storage is protected: the browser will not clear your progress automatically. | 儲存空間已受保護：瀏覽器不會自動清除你的進度。 | 存储空间已受保护：浏览器不会自动清除你的进度。 |
| `st.persist.notProtected` | Storage is not yet protected. The browser may clear it if space runs low. | 儲存空間尚未受保護。空間不足時，瀏覽器可能會清除資料。 | 存储空间尚未受保护。空间不足时，浏览器可能会清除数据。 |
| `st.persist.protect` | Protect it | 啟用保護 | 启用保护 |
| `st.persist.done` | Storage protected. | 儲存空間已受保護。 | 存储空间已受保护。 |
| `st.persist.declined` | Your browser declined. Install the app to your home screen, and keep backups. | 瀏覽器拒絕了。請將應用程式安裝到主畫面，並保留備份。 | 浏览器拒绝了。请将应用安装到主屏幕，并保留备份。 |
| `st.iosBanner` | On iPhone, tap Share → Add to Home Screen. Installed apps keep their data (Safari tabs can lose it after 7 days of no use), but the installed app starts empty, so import a backup into it once. | 在 iPhone 上，點按「分享」→「加入主畫面」。已安裝的應用程式會保留資料（Safari 分頁若 7 天沒使用可能會遺失資料），但已安裝的應用程式一開始是空的，所以請匯入一次備份。 | 在 iPhone 上，点按“分享”→“添加到主屏幕”。已安装的应用会保留数据（Safari 标签页若 7 天没使用可能会丢失数据），但已安装的应用一开始是空的，所以请导入一次备份。 |
| `st.about.title` | About | 關於 | 关于 |
| `st.about.body` | Questions come from the unofficial public question bank at github.com/DHKLeung/life-in-the-uk-test (18 mock exams). They are not Home Office questions. Answers and explanations have been checked against the Life in the UK handbook (3rd edition, with later updates); where the handbook and current law differ, the handbook answer is marked and a note says what changed. Use "Looks wrong?" to flag any answer you doubt. | 題目來自非官方的公開題庫 github.com/DHKLeung/life-in-the-uk-test（18 套模擬試卷），並非英國內政部的題目。答案和解釋已對照《Life in the UK》官方手冊（第 3 版及其後更新）核對；若手冊與現行法律不同，本應用程式會標示手冊的答案，並附註說明有何變動。如對任何答案有疑問，請使用「答案有誤？」標記。 | 题目来自非官方的公开题库 github.com/DHKLeung/life-in-the-uk-test（18 套模拟试卷），并非英国内政部的题目。答案和解析已对照《Life in the UK》官方手册（第 3 版及其后更新）核对；若手册与现行法律不同，本应用会标示手册的答案，并附注说明有何变化。如对任何答案有疑问，请使用“答案有误？”标记。 |
| `st.about.free` | Free and ad-free, made by one person. If it helped, you can buy me a coffee. | 免費、無廣告，由一個人製作。如果對你有幫助，歡迎請我喝杯咖啡。 | 免费、无广告，由一个人制作。如果对你有帮助，欢迎请我喝杯咖啡。 |
| `st.erase` | Erase all progress | 清除所有進度 | 清除所有进度 |
| `st.reset.title` | Erase all progress? | 清除所有進度？ | 清除所有进度？ |
| `st.reset.confirm` | Erase everything | 全部清除 | 全部清除 |
| `st.reset.word` | erase | 清除 | 清除 |
| `st.reset.body` | This deletes {answers} answers, {sessions} sessions, and all notes and saved questions on this device. A copy is kept under "Previous copies" so you can undo it, but download a backup if you are unsure. | 這會刪除此裝置上的 {answers} 個答案、{sessions} 次練習，以及所有筆記和收藏題目。系統會在「以往副本」保留一份副本，方便你復原，但如有疑慮，請先下載備份。 | 这会删除此设备上的 {answers} 个答案、{sessions} 次练习，以及所有笔记和收藏的题目。系统会在“以往副本”中保留一份副本，方便你撤销，但如有疑虑，请先下载备份。 |

## Error messages

| Key | English | 繁體中文 | 简体中文 |
|---|---|---|---|
| `err.notBackup` | Not a valid backup file. | 這不是有效的備份檔案。 | 这不是有效的备份文件。 |
| `err.missingData` | Backup file is missing progress data. | 備份檔案缺少進度資料。 | 备份文件缺少进度数据。 |
| `store.saveError` | Progress could not be saved: browser storage is full or blocked. Download a backup now (Settings). | 無法儲存進度：瀏覽器儲存空間已滿或被封鎖。請立即下載備份（設定）。 | 无法保存进度：浏览器存储空间已满或被阻止。请立即下载备份（设置）。 |
| `store.recovered` | Your latest data could not be read, so progress was restored from the automatic backup of {when}. Anything newer than that was lost. | 無法讀取你最新的資料，因此已從 {when} 的自動備份還原進度。該時間之後的資料已遺失。 | 无法读取你最新的数据，因此已从 {when} 的自动备份还原进度。该时间之后的数据已丢失。 |
| `store.unreadable` | Your saved progress could not be read and there is no automatic backup. The unreadable data was kept aside; import a backup file in Settings to restore. | 無法讀取你儲存的進度，也沒有自動備份。無法讀取的資料已另行保留；請在設定中匯入備份檔案以還原。 | 无法读取你保存的进度，也没有自动备份。无法读取的数据已另行保留；请在设置中导入备份文件以还原。 |
| `store.noSafetyCopy` | Could not save a safety copy (browser storage is full), so nothing was changed. Download a backup first. | 無法儲存安全副本（瀏覽器儲存空間已滿），因此沒有進行任何更改。請先下載備份。 | 无法保存安全副本（浏览器存储空间已满），因此没有做任何更改。请先下载备份。 |
| `store.copyUnreadable` | That copy could not be read. | 無法讀取該副本。 | 无法读取该副本。 |
| `store.restored` | Restored {n} answers. | 已還原 {n} 個答案。 | 已还原 {n} 个答案。 |
| `store.noneReadable` | None of the answers in this file could be read. | 此檔案中沒有可讀取的答案。 | 此文件中没有可读取的答案。 |
| `store.replaced` | Replaced progress with {n} answers{skipped}. Your previous progress was kept under Settings → Previous copies. | 已用 {n} 個答案取代進度{skipped}。你之前的進度保留在「設定」→「以往副本」。 | 已用 {n} 个答案替换进度{skipped}。你之前的进度保留在“设置”→“以往副本”中。 |
| `store.merged` | Merged backup: {n} new answer added{skipped}.<br>Merged backup: {n} new answers added{skipped}. | 已合併備份：新增 {n} 個答案{skipped}。 | 已合并备份：新增 {n} 个答案{skipped}。 |
| `store.skipped` | ({n} unreadable entry skipped)<br>({n} unreadable entries skipped) | （略過 {n} 個無法讀取的項目） | （跳过 {n} 个无法读取的项目） |
| `store.erased` | Progress erased. A safety copy is under Settings → Previous copies. | 進度已清除。安全副本在「設定」→「以往副本」。 | 进度已清除。安全副本在“设置”→“以往副本”中。 |

