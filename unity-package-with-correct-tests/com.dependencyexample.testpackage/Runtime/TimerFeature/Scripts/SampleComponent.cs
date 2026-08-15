using UnityEngine;

public class SampleComponent : MonoBehaviour
{
  public BasicCounter Counter;

  void Start()
  {
    Counter = new BasicCounter(5);
  }

  // Update is called once per frame
  void Update()
  {
    Counter.Increment();
  }
}
