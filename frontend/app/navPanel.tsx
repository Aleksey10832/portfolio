"use client"
import "./navStile.css"
export default function NavPanel(){
    return (
        <nav aria-label="Разделы портфолио">
            <button onClick={() => {
              const about = document.getElementById("about")
              if(about){
                about.scrollIntoView({behavior: "smooth"})
              }
            }}> Обо мне</button>
            <a onClick={() => {
              const about = document.getElementById("skils")
              if(about){
                about.scrollIntoView({behavior: "smooth"})
              }
            }}> Навыки</a>
            <a onClick={() => {
              const about = document.getElementById("experience")
              if(about){
                about.scrollIntoView({behavior: "smooth"})
              }
            }}> Опыт</a>
            <a onClick={() => {
              const about = document.getElementById("projects")
              if(about){
                about.scrollIntoView({behavior: "smooth"})
              }
            }}> Проекты</a>
        </nav>
    )
}