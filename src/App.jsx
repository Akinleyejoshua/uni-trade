import { useEffect, useState } from 'react'
import './App.css'
import { api2, connection } from "./deriv";
import { SiBitcoin, SiRobotframework } from "react-icons/si"
import { request } from "./axios";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { AiOutlineArrowDown, AiOutlineArrowUp, AiOutlineDollarCircle } from "react-icons/ai"

function App() {
  const date = new Date();
  const [state, setState] = useState({
    tick: 0,
    pip: 0,
    tickH: {},
    symbol: "",
    tickSymbol: "",
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hr: date.getHours(),
    min: date.getMinutes(),
    tp: 0,
    price: 0,
    sl: 0,
    order: "neutral",
    interval: "1d",
    pend: 0,
  })


  // const days = ["mon", "tue", "wed", "thur", "fri", "sat", "sun"]
  const months = ["", "jan", "feb", "march", "apr", "may", "june", "july", "aug", "sep", "oct", "nov", "dec"]

  const handleState = (name, val) => {
    setState(prevState => ({
      ...prevState,
      [name]: val
    }))
  }

  const [ticks, setTicks] = useState({
    BTCUSD: {
      tick: 0,
      pip: 0,
    },
    EURUSD: {
      tick: 0,
      pip: 0,
    },
    GBPUSD: {
      tick: 0,
      pip: 0,
    }
  })

  const tickStream = (symbol) => api2.subscribe({ ticks: symbol })

  const streamTicks = async (symbol, name) => {
    await tickStream(symbol);

  }

  connection.addEventListener("message", (res) => {
    const data = JSON.parse(res.data);
    const tick = data;

    if (data.error?.code === "MarketIsClosed") {
      handleState("tick", undefined)
    }

    if (data.msg_type === "tick") {
      if (tick.echo_req.ticks === "cryBTCUSD") {

        setTicks(prev => ({
          ...prev,
          BTCUSD: {
            ...prev.BTCUSD,
            tick: tick?.tick?.bid,
            pip: tick?.tick?.pip_size
          }
        }))
      } else if (tick.echo_req.ticks === "frxEURUSD") {
        setTicks(prev => ({
          ...prev,
          EURUSD: {
            ...prev.EURUSD,
            tick: tick?.tick?.bid,
            pip: tick?.tick?.pip_size
          }
        }))
      } else if (tick.echo_req.ticks === "frxGBPUSD") {
        setTicks(prev => ({
          ...prev,
          GBPUSD: {
            ...prev.GBPUSD,
            tick: tick?.tick?.bid,
            pip: tick?.tick?.pip_size
          }
        }))
      }
      // console.log(ticks)
      state.symbol === "BTC-USD" && handleState("tick", ticks.BTCUSD.tick);
      state.symbol === "GBPUSD=X" && handleState("tick", ticks.GBPUSD.tick);
      state.symbol === "EURUSD=X" && handleState("tick", ticks.EURUSD.tick);
    }

  });



  const setPrice = (len, price) => {
    const { tick } = state;


    if (tick > price) {
      handleState("order", "sell")
      const tp = Number(parseFloat(price) - (len)).toFixed(0)
      const sl = Number(parseFloat(price) + (len)).toFixed(0)
      const pend = Number(parseFloat(price) + (len)).toFixed(0)
      handleState("price", price)
      handleState("tp", tp)
      handleState("sl", sl)
      handleState("pend", pend)

    } else if (tick < price) {
      handleState("order", "buy")
      const tp = Number(parseFloat(price) + (len)).toFixed(0)
      const sl = Number(parseFloat(price) - (len)).toFixed(0)
      const pend = Number(parseFloat(price) - (len)).toFixed(0)

      handleState("price", price)
      handleState("tp", tp)
      handleState("sl", sl)
      handleState("pend", pend)

    }

  }


  const forecast = async () => {
    const { symbol, year, month, day, hr, min, interval } = state;
    const req = await request.get(`/api/forecast?symbol=${symbol}&year=${year}&month=${month}&day=${day}&hours=${hr}&minutes=${min}&sec=00&interval=${interval}`);
    const data = req.data;
    const price = parseFloat(data?.price).toFixed(0);

    // console.log(data)
    if (price !== 0) {

      if (price < 1) {
        setPrice(0.001, price)
      } else if (price < 10) {
        setPrice(0.01, price)
      } else if (price < 100) {
        setPrice(1, price)
      } else if (price < 1000) {
        setPrice(10, price)
      } else if (price < 100000) {
        if (interval === "1d") {
          setPrice(100, price)
        } else {
          setPrice(25, price)
        }

      }

    } else {
      handleState("symbol", "")
      alert("Symbol not available for forecast")
    }

  }
  const [msgSucess, setMsgSuccess] = useState("")

  const train = async () => {
    setMsgSuccess("Training model!")
    const req = await request.get(`/api/trainmodel?symbol=${state.symbol}`);
    const data = req.data;
    data?.message === "done" && setMsgSuccess("Done training model!")
  }

  useEffect(() => {
    streamTicks()
  }, [state])

  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [selectSymbol, setSelectSymbol] = useState({ name: "Select Symbol", icon: <AiOutlineDollarCircle className='icon' /> });
  return (
    <>
      <header>
        <nav>
          <div className="nav-brand">
            <a href="/">UNI-TRADE</a>
          </div>
          <div className="nav-links">
            <button onClick={() => handleState("interval", "1d")} className={`${state.interval === "1d" ? "active" : ""}`}>1D</button>
          </div>
        </nav>

      </header>
      <div className="space"></div>
      <main>
        <h1>Select Symbol</h1>
        <div className="space"></div>
        <div className="row">
          <div className={`${toggleDropdown ? "dropdown col visible" : "dropdown col"}`}>
            <div className='title row' onClick={() => setToggleDropdown(!toggleDropdown)}>
              <p>{selectSymbol.name}</p>
              <div className="space"></div>
              {selectSymbol.icon}
            </div>
            <div className={`${toggleDropdown ? "panel col slide-out" : "panel col slide-in"}`}>
              {[
                { name: "BTC vs USD", tickSymbol: "cryBTCUSD", symbol: "BTC-USD", icon: <SiBitcoin className='icon' /> },
                { name: "GBP vs USD", tickSymbol: "frxGBPUSD", symbol: "GBPUSD=X", icon: <AiOutlineDollarCircle className='icon' /> },
                { name: "EUR vs USD", tickSymbol: "frxEURUSD", symbol: "EURUSD=X", icon: <AiOutlineDollarCircle className='icon' /> }
              ].map((item, i) => {
                return <button className='row' key={i} onClick={() => {
                  setToggleDropdown(false)
                  handleState("symbol", item.symbol);
                  handleState("tickSymbol", item.tickSymbol);
                  setSelectSymbol({ name: item.name, icon: item.icon });
                  streamTicks(item.tickSymbol, item.symbol);
                  handleState("high", "")
                  handleState("price", 0)
                  handleState("tp", 0)
                  handleState("sl", 0)
                  handleState("pend", 0)
                  handleState("order", "neutral")
                  setMsgSuccess("")

                }}>
                  <p>{item.name}</p>
                  <div className="space"></div>
                  {item.icon}
                </button>
              })}
            </div>
          </div>
        </div>
        <div className="space"></div>
        <h1>Select Timestamp</h1>
        <div className="space"></div>
        <form onSubmit={e => {
          e.preventDefault();
          forecast();
        }}>

          <div className="inputs row">

            <div className="input col">
              <small>Year</small>
              <div className="space"></div>
              <input disabled={state.interval === "1h" ? true : false} type="number" value={state.year} className="year" placeholder='Year' onChange={e => handleState("year", e.target.value)} />
            </div>
            <div className="input col">
              <small>Month</small>
              <div className="space"></div>
              <input disabled={state.interval === "1h" ? true : false} type="number" value={state.month} className="month" placeholder='Month' onChange={e => handleState("month", e.target.value)} />
            </div>
            <div className="input col">
              <small>Day</small>
              <div className="space"></div>
              <input disabled={state.interval === "1h" ? true : false} type="number" value={state.day} className="day" placeholder='Day' onChange={e => handleState("day", e.target.value)} />

            </div>

            <div className="input col">
              <small>Hour</small>
              <div className="space"></div>
              <input disabled={state.interval === "1d" ? true : false} type="number" value={state.hr} className="hr" placeholder='Hour' onChange={e => handleState("hr", e.target.value)} />

            </div>
            <div className="input col">
              <small>Minutes</small>
              <div className="space"></div>
              <input disabled={state.interval === "1d" ? true : false} type="number" value={state.min} className="min" placeholder='Minutes' onChange={e => handleState("min", e.target.value)} />

            </div>


          </div>
          {
            state.symbol !== "" && <>

              <div className="space"></div>
              <div className="space"></div>
              <div className="space"></div>

              <div className="time row">
                <p>Forecasting for </p>
                <div className="space"></div>
                <p className='blue'>
                  {state.day} {months[state.month]}  {state.year}
                </p>
              </div>

              <div className="space"></div>
              <div className="space"></div>
              <div className="space"></div>

              <div className="actions row">
                <button className="forecast row" onClick={forecast}>
                  <p>Forecast</p>
                  <div className="space"></div>
                  <SiRobotframework className='icon' />
                </button>
                <div className="space"></div>
                <button className="forecast row" onClick={train}>
                  <p>Train model</p>
                  <div className="space"></div>
                  <SiRobotframework className='icon' />
                </button>
              </div>

              <div className="space"></div>
              <div className="space"></div>
              <div className="space"></div>
              {msgSucess !== "" && <div className="msg-success">{msgSucess}</div>}

              <div className="grid prices">
                <div className="metric col">
                  <div className="row val">
                    <small>current price</small>
                    {state.tick === undefined ? <small className='closed'>closed</small> : <h2>{state.tick}</h2>}
                  </div>
                  <div className="space"></div>

                  <FaMoneyBillTrendUp className='icon' />
                </div>
                <div className="metric col">
                  <div className="row val">
                    <small>forcasting price</small>
                    <h2>{parseFloat(state.price)}</h2>
                  </div>
                  <div className="space"></div>

                  <FaMoneyBillTrendUp className='icon' />
                </div>
                <div className="metric col">
                  <div className="row val">
                    <small>take profit</small>
                    <h2>{state.tp}</h2>
                  </div>
                  <div className="space"></div>

                  <FaMoneyBillTrendUp className='icon' />
                </div>
                <div className="metric col">
                  <div className="row val">
                    <small>stop loss</small>
                    <h2>{state.sl}</h2>
                  </div>
                  <div className="space"></div>

                  <FaMoneyBillTrendUp className='icon' />
                </div>

                {(state.order !== "neutral" && state.tick !== 0 && state.tick !== undefined)
                  &&
                  <div className="metric col" id={`${state.order === "buy" ? "buy" : "sell"}`}>
                    <div className="row val">
                      <small>order now</small>
                      {/* <h2>{state.order}</h2> */}
                      <h2>{state.order} {state.pend !== "" && <>@ {state.pend}</>}</h2>
                    </div>
                    <div className="space"></div>

                    {state.order === "buy" ?
                      <AiOutlineArrowUp className='icon buy' />
                      :
                      <AiOutlineArrowDown className='icon sell' />
                    }
                  </div>
                }

              </div>
            </>
          }

        </form>



      </main>
    </>
  )
}

export default App
