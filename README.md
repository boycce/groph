Groph
====
Create sexy looking line graphs, built with the help of Pixi on the canvas element. Currently groph's API only supports line charts and a single style, but no doubt this will soon change. Made for [Sweet Invoice](http://sweetinvoice.com).

### Road Map ###

- Support for more line chart styling options
- Add a destroy method
- Reduce dependencies
- Create github pages

### Contribute ###

We would love for you to be apart of this project and in the journey of laying down a path for faster, more expressive charting API, in support of canvas (and soon WebGL) which both have optimistic futures. In your pull request please do not commit `groph.min.js`.

### Features ###

- Canvas renderer, what drives Google maps
- Reuse groph instances for a faster build
- Sleek animations

### Example ###

- [Line graph 1](https://github.com/Boyyce/groph/blob/master/example/index.html)

### Usage ###
Include on your page groph and its dependencies. I have compiled pixi with the bare necessities in under < 57kb. This is located inside the `vendors` directory. 
```html
<script src="http://code.jquery.com/jquery-latest.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/tweenjs/0.5.1/tweenjs.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/pixi.js/2.0.0/pixi.min.js"></script>
<script src="../js/groph.min.js"></script>
```
Run Groph

```javascript
var groph = new Groph({
  selector : '#graph1',
  w : 1008,
  h : 365,
  data1: [15, 50, 200, 243, 400, 302, 400],
  data2: [10, 33, 155, 110, 300, 150, 250]
});
```

### Options ###

- `selector`: jQuery selector of your element.
- `w`: Width of the graph
- `h`: Height of the graph
- `pointMax`: Max value of the graph
- `pointMin`: Min value of the graph
- `graphScale`: Scale the graph
- `graphPadding`: eg. `[60, 10, 50, 20]`
- `data1`: Array of your incoming data
- `data2`: Array of your incoming data

### API Methods ###

- `remove`: Removes groph and DOM reference but keeps processed and canvas data.
- `start`: Sets up groph again. You can re-pass `data1` & `data2`.

&nbsp;

Enjoy.
