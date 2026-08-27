# MoonOS

my own little operating system that runs in the browser. it's moon 
themed because i wanted something calm to look at while working on it 
all day.

## try it

https://ashudhanda.github.io/webos/

wait for the boot screen, click anywhere on the lock screen, and you're 
on the desktop. there's no password or login or anything.

## what's inside

10 apps right now:

- **Terminal** — Use help too see commands
- **Calculator**

- **Settings** — themes, accent colors, wallpaper picker
- **Calendar**


## stuff you can do

- drag windows by the title bar, resize them from any side or corner
- the red/yellow/green buttons actually work (close, minimize, maximize)
- hover over the dock — icons grow based on how close your cursor is
- ctrl+k opens search
- right click the desktop for a little menu (refresh, change wallpaper, 
  toggle theme)
- desktop icons can be dragged around and snap to a grid. they stay 
  where you left them even after a refresh
- time and calander on top
- theme: moon

## running it locally

https://github.com/ashudhanda/webos.git

then open index.html with live server (or honestly just double click 
it). there's no build step, no npm, nothing to install. plain html, 
css and js.

## things that took me forever

- the window manager. making windows draggable AND resizable from all 
  sides at the same time broke so many times. ended up using invisible 
  handles on the edges and corners, and checking what you grabbed before 
  deciding whether to drag or resize.
- the dock magnification. i measure the distance from your mouse to each 
  icon and scale them based on that. sounds simple, was not.
- the moon theme gave a clam space and help to focus on work


## credits

- built for hack club stardance (webOS 1 mission), started from their 
  guide and went way past it
- i used very little amount of ai tools to make plan.

made by ashu dhanda — [@ashudhanda](https://github.com/ashudhanda)