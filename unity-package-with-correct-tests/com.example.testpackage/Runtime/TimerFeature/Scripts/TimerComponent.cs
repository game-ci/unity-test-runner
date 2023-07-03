using UnityEngine;

public class TimerComponent : MonoBehaviour
{
  public BasicCounter Counter = new BasicCounter();
  public float Timer = 1f;

  void Update()
  {
    Timer -= Time.deltaTime;

    if (Timer > 0)
      return;

    Counter.Increment();
    Timer = 1f;
  }
}
