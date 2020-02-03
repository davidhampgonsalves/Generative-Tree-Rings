# Tree-Ring Generation

Simulates randomized enviornmental factors to "grow" a tree and then cut it down to see its age rings.

<p style="text-align:center">
  <img src="https://github.com/davidhampgonsalves/tree-rings/blob/master/sample.png" width="100%">
</p>

## Running
Load `tree.htm` in a browser (Ideally Firefox).

Each time the page loads it will generate a new tree ring. Once you have one you like click the generate SVG link, which will write the svg markup to the console for you to copy into a file.

If the script blows up or generates something bizzare, take a deep breath and refresh the page. This code is inefficient, error prone and a mess caused by its many purposes and long life.

## History

Originally this code generated color svg files but I was never happy with the results (see [old commit](https://github.com/davidhampgonsalves/tree-rings/tree/a574a05993379ea14bbe47f3019c5f65fad7595e) for samples). After building a [MidTBot](https://github.com/bdring/midTbot_esp32) I modified the code to generate a more plotable svg.

You can read more about the original idea [in this blog post](https://www.davidhampgonsalves.com/failed-projects-tree-ring-generation/).
