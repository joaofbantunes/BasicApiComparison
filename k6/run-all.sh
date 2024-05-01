#!/bin/sh

vu=10
duration="5s"

echo "running csharp"
k6 run -e STACK=csharp -e URL=http://localhost:6000 --vus $vu --duration $duration script.js

echo "running csharp aot"
k6 run -e STACK=csharp-aot -e URL=http://localhost:6008 --vus $vu --duration $duration script.js

echo "running csharp r2r"
k6 run -e STACK=csharp-r2r -e URL=http://localhost:6001 --vus $vu --duration $duration script.js

echo "running csharp controllers"
k6 run -e STACK=csharp-controllers -e URL=http://localhost:6010 --vus $vu --duration $duration script.js

echo "running fsharp"
k6 run -e STACK=fsharp -e URL=http://localhost:6002 --vus $vu --duration $duration script.js

echo "running python"
k6 run -e STACK=python -e URL=http://localhost:6003 --vus $vu --duration $duration script.js

echo "running node raw"
k6 run -e STACK=node-raw -e URL=http://localhost:6004 --vus $vu --duration $duration script.js

echo "running node express"
k6 run -e STACK=node-express -e URL=http://localhost:6005 --vus $vu --duration $duration script.js

echo "running go"
k6 run -e STACK=go -e URL=http://localhost:6006 --vus $vu --duration $duration script.js

echo "running kotlin"
k6 run -e STACK=kotlin -e URL=http://localhost:6007 --vus $vu --duration $duration script.js

echo "running rust actix"
k6 run -e STACK=rust-actix -e URL=http://localhost:6009 --vus $vu --duration $duration script.js

echo "running rust axum"
k6 run -e STACK=rust-axum -e URL=http://localhost:6013 --vus $vu --duration $duration script.js

echo "running bun raw"
k6 run -e STACK=bun-raw -e URL=http://localhost:6011 --vus $vu --duration $duration script.js

echo "running bun hono"
k6 run -e STACK=bun-hono -e URL=http://localhost:6012 --vus $vu --duration $duration script.js