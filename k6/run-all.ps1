$vu = 15
$duration = "5s"


echo "running csharp (cold start)"
k6 run -e STACK=csharp -e URL=http://localhost:6000 --vus $vu --duration $duration script.js

echo "running csharp"
k6 run -e STACK=csharp -e URL=http://localhost:6000 --vus $vu --duration $duration script.js

echo "running csharp tiered pgo (cold start)"
k6 run -e STACK=csharp-tiered-pgo -e URL=http://localhost:6008 --vus $vu --duration $duration script.js

echo "running csharp tiered pgo"
k6 run -e STACK=csharp-tiered-pgo -e URL=http://localhost:6008 --vus $vu --duration $duration script.js

# echo "running csharp r2r (cold start)"
# k6 run -e STACK=csharp-r2r -e URL=http://localhost:6001 --vus $vu --duration $duration script.js

# echo "running csharp r2r"
# k6 run -e STACK=csharp-r2r -e URL=http://localhost:6001 --vus $vu --duration $duration script.js

echo "running fsharp (cold start)"
k6 run -e STACK=fsharp -e URL=http://localhost:6002 --vus $vu --duration $duration script.js

echo "running fsharp"
k6 run -e STACK=fsharp -e URL=http://localhost:6002 --vus $vu --duration $duration script.js

echo "running python (cold start)"
k6 run -e STACK=python -e URL=http://localhost:6003 --vus $vu --duration $duration script.js

echo "running python"
k6 run -e STACK=python -e URL=http://localhost:6003 --vus $vu --duration $duration script.js

echo "running node raw (cold start)"
k6 run -e STACK=node-raw -e URL=http://localhost:6004 --vus $vu --duration $duration script.js

echo "running node raw"
k6 run -e STACK=node-raw -e URL=http://localhost:6004 --vus $vu --duration $duration script.js

echo "running node express (cold start)"
k6 run -e STACK=node-express -e URL=http://localhost:6005 --vus $vu --duration $duration script.js

echo "running node express"
k6 run -e STACK=node-express -e URL=http://localhost:6005 --vus $vu --duration $duration script.js

echo "running go (cold start)"
k6 run -e STACK=go -e URL=http://localhost:6006 --vus $vu --duration $duration script.js

echo "running go"
k6 run -e STACK=go -e URL=http://localhost:6006 --vus $vu --duration $duration script.js

echo "running kotlin (cold start)"
k6 run -e STACK=kotlin -e URL=http://localhost:6007 --vus $vu --duration $duration script.js

echo "running kotlin"
k6 run -e STACK=kotlin -e URL=http://localhost:6007 --vus $vu --duration $duration script.js

echo "running rust (cold start)"
k6 run -e STACK=rust -e URL=http://localhost:6009 --vus $vu --duration $duration script.js

echo "running rust"
k6 run -e STACK=rust -e URL=http://localhost:6009 --vus $vu --duration $duration script.js