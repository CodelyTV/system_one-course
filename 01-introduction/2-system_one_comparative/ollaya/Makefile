MODELS ?= laya kev:0.8b clef-flash

.PHONY: start

start:
	ollaya serve & \
	trap "kill $$!" INT TERM EXIT; \
	until curl -sf localhost:11435/v1/models > /dev/null; do sleep 1; done; \
	for model in $(MODELS); do ollaya pull $$model || exit 1; done; \
	wait
