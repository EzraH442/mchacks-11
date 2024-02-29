package socket

import (
	"encoding/json"
	"fmt"
)

type HyperoptResponseID string

const (
	HyperoptRecieveNextParamResponsesID HyperoptResponseID = "push-opt-params"
)

type HyperoptRecieveNextParamsResponse struct {
	ID       HyperoptResponseID `json:"id"`
	ParamsID string             `json:"params_id"`
	Params   interface{}        `json:"params"`
	VTable   interface{}        `json:"v_table"`
}

func (c *HyperoptClient) handleHyperoptRecieveNextParamsResponse(bytes []byte) {
	HyperoptRecieveNextParamsResponse := HyperoptRecieveNextParamsResponse{}

	if err := json.Unmarshal(bytes, &HyperoptRecieveNextParamsResponse); err != nil {
		fmt.Println("Error unmarshalling message: ", err)
		return
	}

	c.hub.paramsQueue <- ParamsInfo{
		ParamsID: HyperoptRecieveNextParamsResponse.ParamsID,
		Params:   HyperoptRecieveNextParamsResponse.Params,
		VTable:   HyperoptRecieveNextParamsResponse.VTable,
	}
}
